import SwiftUI

@main
struct SlideAppClip: App {
    var body: some Scene {
        WindowGroup {
            VStack(spacing: 16) {
                Text("Slide App Clip")
                    .font(.title)
                    .fontWeight(.bold)
                Text("Purchase a pass to skip the line.")
                    .font(.subheadline)
            }
            .padding()
        }
    }
}
