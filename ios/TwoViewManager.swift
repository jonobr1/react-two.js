import React

@objc(TwoViewManager)
class TwoViewManager: RCTViewManager {

  override func view() -> (TwoMetalView) {
    return TwoMetalView()
  }

  @objc override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
