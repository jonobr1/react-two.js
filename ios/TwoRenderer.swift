import MetalKit

struct Vertex {
    var position: SIMD2<Float>
    var color: SIMD4<Float>
}

struct DrawCall {
    var type: MTLPrimitiveType
    var vertexStart: Int
    var vertexCount: Int
}

class TwoRenderer: NSObject, MTKViewDelegate {
    
    let device: MTLDevice
    let commandQueue: MTLCommandQueue?
    var pipelineState: MTLRenderPipelineState?
    var viewportSize: SIMD2<Float> = .zero
    
    // Data to render
    var vertices: [Vertex] = []
    var drawCalls: [DrawCall] = []
    
    init(device: MTLDevice, view: MTKView) {
        self.device = device
        self.commandQueue = device.makeCommandQueue()
        super.init()
        
        buildPipelineState(view: view)
    }
    
    private func buildPipelineState(view: MTKView) {
        guard let library = device.makeDefaultLibrary() else { return }
        
        let vertexFunction = library.makeFunction(name: "vertex_main")
        let fragmentFunction = library.makeFunction(name: "fragment_main")
        
        let pipelineDescriptor = MTLRenderPipelineDescriptor()
        pipelineDescriptor.label = "TwoRenderPipeline"
        pipelineDescriptor.vertexFunction = vertexFunction
        pipelineDescriptor.fragmentFunction = fragmentFunction
        pipelineDescriptor.colorAttachments[0].pixelFormat = view.colorPixelFormat
        
        // Enable alpha blending
        pipelineDescriptor.colorAttachments[0].isBlendingEnabled = true
        pipelineDescriptor.colorAttachments[0].rgbBlendOperation = .add
        pipelineDescriptor.colorAttachments[0].alphaBlendOperation = .add
        pipelineDescriptor.colorAttachments[0].sourceRGBBlendFactor = .sourceAlpha
        pipelineDescriptor.colorAttachments[0].destinationRGBBlendFactor = .oneMinusSourceAlpha
        pipelineDescriptor.colorAttachments[0].sourceAlphaBlendFactor = .sourceAlpha
        pipelineDescriptor.colorAttachments[0].destinationAlphaBlendFactor = .oneMinusSourceAlpha
        
        do {
            pipelineState = try device.makeRenderPipelineState(descriptor: pipelineDescriptor)
        } catch {
            print("Failed to create pipeline state: \(error)")
        }
    }
    
    func updateDrawCommands(_ commands: [String: Any]) {
        var newVertices: [Vertex] = []
        var newDrawCalls: [DrawCall] = []
        
        // Start with identity matrix
        let identity = matrix_float3x3(diagonal: SIMD3<Float>(1, 1, 1))
        
        if let children = commands["children"] as? [[String: Any]] {
            for child in children {
                parseNode(child, transform: identity, vertices: &newVertices, drawCalls: &newDrawCalls)
            }
        }
        
        self.vertices = newVertices
        self.drawCalls = newDrawCalls
    }
    
    private func parseNode(_ node: [String: Any], transform: matrix_float3x3, vertices: inout [Vertex], drawCalls: inout [DrawCall]) {
        // Calculate local transform
        // We expect translation, rotation, scale in the JSON
        // Default to identity values if missing
        
        let tx = Float((node["translation"] as? [String: Any])?["x"] as? Double ?? 0)
        let ty = Float((node["translation"] as? [String: Any])?["y"] as? Double ?? 0)
        let rotation = Float(node["rotation"] as? Double ?? 0)
        let sx = Float((node["scale"] as? [String: Any])?["x"] as? Double ?? 1)
        let sy = Float((node["scale"] as? [String: Any])?["y"] as? Double ?? 1)
        
        // Construct local matrix
        // 2D Affine Transform in 3x3 matrices:
        // [ cx  -sy  tx ]
        // [ sx   cy  ty ]
        // [ 0    0   1  ]
        // But SIMD matches column-major usually.
        // Let's build T * R * S
        
        // Translation
        let T = matrix_float3x3(columns: (
            SIMD3<Float>(1, 0, 0),
            SIMD3<Float>(0, 1, 0),
            SIMD3<Float>(tx, ty, 1)
        ))
        
        // Rotation
        let c = cos(rotation)
        let s = sin(rotation)
        let R = matrix_float3x3(columns: (
            SIMD3<Float>(c, s, 0),
            SIMD3<Float>(-s, c, 0),
            SIMD3<Float>(0, 0, 1)
        ))
        
        // Scale
        let S = matrix_float3x3(columns: (
            SIMD3<Float>(sx, 0, 0),
            SIMD3<Float>(0, sy, 0),
            SIMD3<Float>(0, 0, 1)
        ))
        
        // Combine: Parent * T * R * S
        // Note: matrix_float3x3 multiplication order depends on vector convention.
        // If we use v * M, then M = S * R * T * Parent?
        // Let's assume M * v, so M = Parent * T * R * S
        let localTransform = matrix_multiply(T, matrix_multiply(R, S))
        let globalTransform = matrix_multiply(transform, localTransform)

        // Check if it's a group
        if let children = node["children"] as? [[String: Any]] {
            for child in children {
                parseNode(child, transform: globalTransform, vertices: &vertices, drawCalls: &drawCalls)
            }
            return
        }
        
        // Handle Shape
        guard let rawVertices = node["vertices"] as? [[String: Any]], !rawVertices.isEmpty else {
            return
        }
        
        let worldPoints = rawVertices.compactMap { v -> SIMD2<Float>? in
            guard let x = v["x"] as? Double, let y = v["y"] as? Double else { return nil }
            let localPos = SIMD3<Float>(Float(x), Float(y), 1)
            let worldPos = matrix_multiply(globalTransform, localPos)
            return SIMD2<Float>(worldPos.x, worldPos.y)
        }
        
        guard worldPoints.count >= 2 else { return }
        
        // 1. Fill
        if let fill = node["fill"] as? String, fill != "none" {
            let fillColor = parseHexColor(fill, opacity: Float(node["opacity"] as? Double ?? 1.0))
            let startIdx = vertices.count
            
            // Simple Fan Triangulation (assumes convex)
            for i in 1..<worldPoints.count - 1 {
                vertices.append(Vertex(position: worldPoints[0], color: fillColor))
                vertices.append(Vertex(position: worldPoints[i], color: fillColor))
                vertices.append(Vertex(position: worldPoints[i+1], color: fillColor))
            }
            
            let count = vertices.count - startIdx
            if count > 0 {
                drawCalls.append(DrawCall(type: .triangle, vertexStart: startIdx, vertexCount: count))
            }
        }
        
        // 2. Stroke
        if let stroke = node["stroke"] as? String, stroke != "none" {
            let strokeColor = parseHexColor(stroke, opacity: Float(node["opacity"] as? Double ?? 1.0))
            let startIdx = vertices.count
            
            for p in worldPoints {
                vertices.append(Vertex(position: p, color: strokeColor))
            }
            
            if let closed = node["closed"] as? Bool, closed {
                vertices.append(Vertex(position: worldPoints[0], color: strokeColor))
            }
            
            let count = vertices.count - startIdx
            if count > 0 {
                // Use lineStrip for now. 
                // For proper thickness, we'd need to generate triangles based on linewidth.
                drawCalls.append(DrawCall(type: .lineStrip, vertexStart: startIdx, vertexCount: count))
            }
        }
    }
    
    private func parseHexColor(_ hex: String, opacity: Float = 1.0) -> SIMD4<Float> {
        var cString = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        
        if cString.hasPrefix("#") {
            cString.remove(at: cString.startIndex)
        }
        
        if cString.count == 3 {
            var expanded = ""
            for char in cString {
                expanded.append(char)
                expanded.append(char)
            }
            cString = expanded
        }
        
        if cString.count != 6 {
            return SIMD4<Float>(0.5, 0.5, 0.5, opacity) // Gray fallback
        }
        
        var rgbValue: UInt64 = 0
        Scanner(string: cString).scanHexInt64(&rgbValue)
        
        return SIMD4<Float>(
            Float((rgbValue & 0xFF0000) >> 16) / 255.0,
            Float((rgbValue & 0x00FF00) >> 8) / 255.0,
            Float(rgbValue & 0x0000FF) / 255.0,
            opacity
        )
    }
    
    func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {
        viewportSize = SIMD2<Float>(Float(size.width), Float(size.height))
    }
    
    func draw(in view: MTKView) {
        guard !vertices.isEmpty,
              let pipelineState = pipelineState,
              let drawable = view.currentDrawable,
              let renderPassDescriptor = view.currentRenderPassDescriptor,
              let commandQueue = commandQueue,
              let commandBuffer = commandQueue.makeCommandBuffer(),
              let renderEncoder = commandBuffer.makeRenderCommandEncoder(descriptor: renderPassDescriptor) else {
            return
        }
        
        renderEncoder.setRenderPipelineState(pipelineState)
        renderEncoder.setViewport(MTLViewport(originX: 0, originY: 0, width: Double(viewportSize.x), height: Double(viewportSize.y), znear: 0, zfar: 1))
        
        // Send viewport size
        renderEncoder.setVertexBytes(&viewportSize, length: MemoryLayout<SIMD2<Float>>.stride, index: 1)
        
        // Send vertices
        // In a real app, use a MTLBuffer for better performance
        renderEncoder.setVertexBytes(vertices, length: vertices.count * MemoryLayout<Vertex>.stride, index: 0)
        
        // Execute draw calls
        for call in drawCalls {
            renderEncoder.drawPrimitives(type: call.type, vertexStart: call.vertexStart, vertexCount: call.vertexCount)
        }
        
        renderEncoder.endEncoding()
        commandBuffer.present(drawable)
        commandBuffer.commit()
    }
}
