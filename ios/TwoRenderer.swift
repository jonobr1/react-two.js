import MetalKit

struct Vertex {
    var position: SIMD2<Float>
    var color: SIMD4<Float>
}

class TwoRenderer: NSObject, MTKViewDelegate {
    
    let device: MTLDevice
    let commandQueue: MTLCommandQueue?
    var pipelineState: MTLRenderPipelineState?
    var viewportSize: SIMD2<Float> = .zero
    
    // Data to render
    var vertices: [Vertex] = []
    
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
        // Parse commands and generate vertices
        var newVertices: [Vertex] = []
        
        // Start with identity matrix
        let identity = matrix_float3x3(diagonal: SIMD3<Float>(1, 1, 1))
        
        if let children = commands["children"] as? [[String: Any]] {
            for child in children {
                parseShape(child, transform: identity, into: &newVertices)
            }
        }
        
        self.vertices = newVertices
    }
    
    private func parseShape(_ shape: [String: Any], transform: matrix_float3x3, into vertices: inout [Vertex]) {
        // Calculate local transform
        // We expect translation, rotation, scale in the JSON
        // Default to identity values if missing
        
        let tx = Float((shape["translation"] as? [String: Double])?["x"] ?? 0)
        let ty = Float((shape["translation"] as? [String: Double])?["y"] ?? 0)
        let rotation = Float(shape["rotation"] as? Double ?? 0)
        let sx = Float((shape["scale"] as? [String: Double])?["x"] ?? 1)
        let sy = Float((shape["scale"] as? [String: Double])?["y"] ?? 1)
        
        // Construct local matrix
        // 2D Affine Transform in 3x3 matrices:
        // [ cx  -sy  tx ]
        // [ sx   cy  ty ]
        // [ 0    0   1  ]
        // But SIMD matches column-major usually.
        // Let's build T * R * S
        
        var matrix = matrix_identity_float3x3
        
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
        matrix = matrix_multiply(T, matrix_multiply(R, S))
        let globalTransform = matrix_multiply(transform, matrix)

        // Check if it's a group
        if let children = shape["children"] as? [[String: Any]] {
            for child in children {
                parseShape(child, transform: globalTransform, into: &vertices)
            }
            return
        }
        
        // It's a shape
        guard let shapeVertices = shape["vertices"] as? [[String: Any]] else {
            return
        }
        
        // Parse color
        var color = SIMD4<Float>(0, 0, 0, 1) // Default black
        
        if let fill = shape["fill"] as? String {
            color = parseHexColor(fill)
        }
        
        // Convert shape vertices to Metal vertices
        for v in shapeVertices {
            if let x = v["x"] as? Double, let y = v["y"] as? Double {
                let localPos = SIMD3<Float>(Float(x), Float(y), 1)
                // Apply transform
                let worldPos = matrix_multiply(globalTransform, localPos)
                
                vertices.append(Vertex(
                    position: SIMD2<Float>(worldPos.x, worldPos.y),
                    color: color
                ))
            }
        }
    }
    
    private func parseHexColor(_ hex: String) -> SIMD4<Float> {
        var cString = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        
        if cString.hasPrefix("#") {
            cString.remove(at: cString.startIndex)
        }
        
        if cString.count != 6 {
            return SIMD4<Float>(0.5, 0.5, 0.5, 1) // Gray fallback
        }
        
        var rgbValue: UInt64 = 0
        Scanner(string: cString).scanHexInt64(&rgbValue)
        
        return SIMD4<Float>(
            Float((rgbValue & 0xFF0000) >> 16) / 255.0,
            Float((rgbValue & 0x00FF00) >> 8) / 255.0,
            Float(rgbValue & 0x0000FF) / 255.0,
            1.0
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
        
        // Draw primitives
        // Assuming TRIANGLE_STRIP or TRIANGLES based on data
        // For this demo, we use POINTS or LINE_STRIP to see something
        renderEncoder.drawPrimitives(type: .triangleStrip, vertexStart: 0, vertexCount: vertices.count)
        
        renderEncoder.endEncoding()
        commandBuffer.present(drawable)
        commandBuffer.commit()
    }
}
