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
        // This is a simplified parser
        var newVertices: [Vertex] = []
        
        if let children = commands["children"] as? [[String: Any]] {
            for child in children {
                parseShape(child, into: &newVertices)
            }
        }
        
        self.vertices = newVertices
    }
    
    private func parseShape(_ shape: [String: Any], into vertices: inout [Vertex]) {
        // Check if it's a group
        if let children = shape["children"] as? [[String: Any]] {
            for child in children {
                parseShape(child, into: &vertices)
            }
            return
        }
        
        // It's a shape
        guard let shapeVertices = shape["vertices"] as? [[String: Any]],
              let translation = shape["translation"] as? [String: Double] else {
            return
        }
        
        let tx = Float(translation["x"] ?? 0)
        let ty = Float(translation["y"] ?? 0)
        
        // Parse color (simplified, assumes hex or basic support needed)
        // For now default to red
        let color = SIMD4<Float>(1, 0, 0, 1) 
        
        // Convert shape vertices to Metal vertices
        // This assumes TRIANGLES for now, but Two.js paths might be complex.
        // A real implementation needs a tessellator.
        for v in shapeVertices {
            if let x = v["x"] as? Double, let y = v["y"] as? Double {
                vertices.append(Vertex(
                    position: SIMD2<Float>(Float(x) + tx, Float(y) + ty),
                    color: color
                ))
            }
        }
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
