import MetalKit
import React

class TwoMetalView: MTKView {
  
  var renderer: TwoRenderer?

  @objc var drawCommands: NSDictionary = [:] {
    didSet {
      // Trigger a redraw when new commands arrive
      // In a real implementation, we would decode the commands here
      // and pass them to the renderer.
      self.setNeedsDisplay()
    }
  }

  init() {
    super.init(frame: .zero, device: MTLCreateSystemDefaultDevice())
    
    guard let device = self.device else {
      print("Metal is not supported on this device")
      return
    }
    
    self.renderer = TwoRenderer(device: device, view: self)
    self.delegate = self.renderer
    
    // Configure the view
    self.colorPixelFormat = .bgra8Unorm
    self.framebufferOnly = true
    self.enableSetNeedsDisplay = true // Only draw when requested
    self.isPaused = true // We control the loop via drawCommands updates
  }
  
  required init(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}
