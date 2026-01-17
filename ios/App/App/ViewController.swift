import UIKit
import Capacitor
import WebKit
import WidgetKit
import UserNotifications

class ViewController: CAPBridgeViewController, WKScriptMessageHandler {
    
    // Haptic Generators (initialized once for performance)
    private let notificationGenerator = UINotificationFeedbackGenerator()
    private let impactGenerator = UIImpactFeedbackGenerator(style: .medium)
    private let selectionGenerator = UISelectionFeedbackGenerator()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        print("------------- CUSTOM VIEW CONTROLLER LOADED - Native Bridges Active -------------")
        
        // Register message handlers
        self.webView?.configuration.userContentController.add(self, name: "widgetBridge")
        self.webView?.configuration.userContentController.add(self, name: "hapticBridge")
        self.webView?.configuration.userContentController.add(self, name: "notificationBridge")
        
        // Pre-warm haptic engine
        notificationGenerator.prepare()
        impactGenerator.prepare()
    }
    
    // Handle specific messages from JS
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        
        // WIDGET DATA BRIDGE
        if message.name == "widgetBridge" {
            if let jsonString = message.body as? String {
                print("🔵 WIDGET DATA: \(jsonString)")
                
                if let userDefaults = UserDefaults(suiteName: "group.com.budgetpro.data") {
                    userDefaults.set(jsonString, forKey: "widgetData")
                    userDefaults.synchronize()
                }
                
                if #available(iOS 14.0, *) {
                    WidgetCenter.shared.reloadAllTimelines()
                }
            }
        }
        
        // HAPTIC FEEDBACK BRIDGE
        if message.name == "hapticBridge", let hapticType = message.body as? String {
            print("📳 HAPTIC: \(hapticType)")
            triggerHaptic(type: hapticType)
        }
        
        // NOTIFICATION BRIDGE
        if message.name == "notificationBridge", let jsonString = message.body as? String {
            print("🔔 NOTIFICATION REQUEST: \(jsonString)")
            handleNotificationRequest(jsonString: jsonString)
        }
    }
    
    // MARK: - Haptic Engine
    private func triggerHaptic(type: String) {
        switch type {
        case "success":
            notificationGenerator.notificationOccurred(.success)
        case "warning":
            notificationGenerator.notificationOccurred(.warning)
        case "error":
            notificationGenerator.notificationOccurred(.error)
        case "light":
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        case "medium":
            impactGenerator.impactOccurred()
        case "heavy":
            UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        case "selection":
            selectionGenerator.selectionChanged()
        default:
            impactGenerator.impactOccurred()
        }
    }
    
    // MARK: - Notification Engine
    private func handleNotificationRequest(jsonString: String) {
        guard let data = jsonString.data(using: .utf8),
              let payload = try? JSONDecoder().decode(NotificationPayload.self, from: data) else {
            print("❌ Invalid notification payload")
            return
        }
        
        let center = UNUserNotificationCenter.current()
        
        switch payload.action {
        case "schedule":
            scheduleNotification(payload: payload, center: center)
        case "cancel":
            center.removePendingNotificationRequests(withIdentifiers: [payload.id])
            print("🗑️ Cancelled notification: \(payload.id)")
        case "cancelAll":
            center.removeAllPendingNotificationRequests()
            print("🗑️ Cancelled all notifications")
        default:
            print("⚠️ Unknown notification action: \(payload.action)")
        }
    }
    
    private func scheduleNotification(payload: NotificationPayload, center: UNUserNotificationCenter) {
        let content = UNMutableNotificationContent()
        content.title = payload.title
        content.body = payload.body
        content.sound = .default
        
        // Parse date string (ISO 8601)
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        guard let triggerDate = formatter.date(from: payload.date) else {
            print("❌ Invalid date format: \(payload.date)")
            return
        }
        
        let triggerComponents = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: triggerDate)
        let trigger = UNCalendarNotificationTrigger(dateMatching: triggerComponents, repeats: false)
        
        let request = UNNotificationRequest(identifier: payload.id, content: content, trigger: trigger)
        
        center.add(request) { error in
            if let error = error {
                print("❌ Notification schedule failed: \(error.localizedDescription)")
            } else {
                print("✅ Notification scheduled: \(payload.id) at \(payload.date)")
            }
        }
    }
}

// Notification Payload Structure
struct NotificationPayload: Codable {
    let action: String   // "schedule", "cancel", "cancelAll"
    let id: String
    let title: String
    let body: String
    let date: String     // ISO 8601 date string
    
    enum CodingKeys: String, CodingKey {
        case action, id, title, body, date
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        action = try container.decode(String.self, forKey: .action)
        id = try container.decodeIfPresent(String.self, forKey: .id) ?? ""
        title = try container.decodeIfPresent(String.self, forKey: .title) ?? ""
        body = try container.decodeIfPresent(String.self, forKey: .body) ?? ""
        date = try container.decodeIfPresent(String.self, forKey: .date) ?? ""
    }
}
