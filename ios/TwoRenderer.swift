import MetalKit

class TwoRenderer: NSObject, MTKViewDelegate {
  
  let device: MTLDevice
  let commandQueue: MTLCommandQueue?
  
  init(device: MTLDevice, view: MTKView) {
    self.device = device
    self.commandQueue = device.makeCommandQueue()
    super.init()
  }
  
  func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {
    // Handle resize
  }
  
  func draw(in view: MTKView) {
    guard let drawable = view.currentDrawable,
          let renderPassDescriptor = view.currentRenderPassDescriptor,
          let commandQueue = commandQueue,
          let commandBuffer = commandQueue.makeCommandBuffer(),
          let renderEncoder = commandBuffer.makeRenderCommandEncoder(descriptor: renderPassDescriptor) else {
      return
    }
    
    // Clear background
    // In a real implementation, we would iterate over the drawCommands here
    // and encode vertex/fragment shaders for each shape.
    
    renderEncoder.endEncoding()
    commandBuffer.present(drawable)
    commandBuffer.commit()
  }
}
