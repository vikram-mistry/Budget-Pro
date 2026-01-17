//
//  BudgetWidget.swift
//  BudgetWidget
//
//  Created by Budget Pro AI on 16/01/26.
//

import WidgetKit
import SwiftUI

// ROBUST DATA MODEL: All fields optional to prevent decoding crashes
struct BudgetData: Codable {
    let expense: Double?
    let income: Double?
    let budget: Double?
    let month: String?
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), data: BudgetData(expense: 15000, income: 45000, budget: 50000, month: "Jan"))
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), data: BudgetData(expense: 12450, income: 60000, budget: 30000, month: "Jan"))
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [SimpleEntry] = []
        
        let userDefaults = UserDefaults(suiteName: "group.com.budgetpro.data")
        let jsonString = userDefaults?.string(forKey: "widgetData")
        
        // Default safe values
        var budgetData = BudgetData(expense: 0, income: 0, budget: 0, month: "")
        
        if let json = jsonString {
            // Debug: Print raw JSON to console (visible in Console.app)
            print("Widget Raw JSON: \(json)")
            
            if let data = json.data(using: .utf8) {
                if let decoded = try? JSONDecoder().decode(BudgetData.self, from: data) {
                    budgetData = decoded
                } else {
                    print("Widget Decoding Failed!")
                }
            }
        }
        
        let currentDate = Date()
        for hourOffset in 0 ..< 5 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = SimpleEntry(date: entryDate, data: budgetData)
            entries.append(entry)
        }

        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let data: BudgetData
}

struct BudgetWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var colorScheme

    // Safe Accessors
    var safeExpense: Double { entry.data.expense ?? 0 }
    var safeIncome: Double { entry.data.income ?? 0 }
    var safeBudget: Double { entry.data.budget ?? 0 }
    var safeMonth: String { entry.data.month ?? "" }

    // Define colors that work in both modes
    var buttonGradient: LinearGradient {
        LinearGradient(
            gradient: Gradient(colors: [
                Color(red: 14/255, green: 165/255, blue: 233/255),  // sky-500 (darker)
                Color(red: 16/255, green: 185/255, blue: 129/255)   // emerald-500 (darker)
            ]),
            startPoint: .leading,
            endPoint: .trailing
        )
    }
    
    var body: some View {
        ZStack {
            // Background Graphics (BOTH widgets)
            ZStack {
                // Top Right Rupee Coin
                VStack {
                    HStack {
                        Spacer()
                        Image(systemName: "indianrupeesign.circle.fill")
                            .font(.system(size: family == .systemSmall ? 50 : 90))
                            .foregroundColor(colorScheme == .dark 
                                ? Color.white.opacity(0.08) 
                                : Color(red: 30/255, green: 64/255, blue: 175/255).opacity(0.15)) // Blue tint for light
                            .rotationEffect(.degrees(15))
                            .offset(x: family == .systemSmall ? 10 : 20, y: family == .systemSmall ? -10 : -20)
                    }
                    Spacer()
                }
                // Bottom Coin - Left for small, Center for medium
                VStack {
                    Spacer()
                    HStack {
                        if family == .systemMedium {
                            Spacer()
                        }
                        Image(systemName: "bitcoinsign.circle.fill")
                            .font(.system(size: family == .systemSmall ? 35 : 60))
                            .foregroundColor(colorScheme == .dark 
                                ? Color.white.opacity(0.06) 
                                : Color(red: 30/255, green: 64/255, blue: 175/255).opacity(0.10))
                            .rotationEffect(.degrees(-15))
                            .offset(x: family == .systemSmall ? -10 : 0, y: family == .systemSmall ? 10 : 20)
                        if family == .systemMedium {
                            Spacer()
                        } else {
                            Spacer()
                        }
                    }
                }
            }
            
            // Main Content
            VStack(alignment: .leading, spacing: 0) {
                // Header with shadow for light mode
                HStack {
                    Text("Budget Pro")
                        .font(.system(size: family == .systemSmall ? 15 : 18, weight: .black, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(
                                colors: colorScheme == .dark 
                                    ? [Color(red: 56/255, green: 189/255, blue: 248/255), Color(red: 52/255, green: 211/255, blue: 153/255)]
                                    : [Color(red: 2/255, green: 132/255, blue: 199/255), Color(red: 5/255, green: 150/255, blue: 105/255)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                        .shadow(color: colorScheme == .dark ? .clear : Color.black.opacity(0.1), radius: 1, x: 0, y: 1)
                    Spacer()
                }
                .padding(.bottom, family == .systemSmall ? 8 : 10)
                
                // Content Row
                HStack(alignment: .center, spacing: 10) {
                    // Dual Ring Chart - BIGGER for small widget
                    ZStack {
                        // Background Ring
                        Circle()
                            .stroke(colorScheme == .dark 
                                ? Color.white.opacity(0.08) 
                                : Color(red: 100/255, green: 116/255, blue: 139/255).opacity(0.3),
                                lineWidth: family == .systemSmall ? 8 : 8)
                        
                        // Expense Ring (Red) - Outer
                        Circle()
                            .trim(from: 0, to: safeBudget > 0 ? CGFloat(min(1.0, safeExpense / safeBudget)) : 0.001)
                            .stroke(
                                LinearGradient(gradient: Gradient(colors: [
                                    Color(red: 220/255, green: 38/255, blue: 38/255),
                                    Color(red: 239/255, green: 68/255, blue: 68/255)
                                ]), startPoint: .top, endPoint: .bottom),
                                style: StrokeStyle(lineWidth: family == .systemSmall ? 8 : 8, lineCap: .round)
                            )
                            .rotationEffect(.degrees(-90))
                            .shadow(color: colorScheme == .dark ? .clear : Color.red.opacity(0.3), radius: 2)
                        
                        // Income Ring (Green) - Inner
                        Circle()
                            .trim(from: 0, to: safeBudget > 0 ? CGFloat(min(1.0, safeIncome / safeBudget)) : 0.001)
                            .stroke(
                                LinearGradient(gradient: Gradient(colors: [
                                    Color(red: 5/255, green: 150/255, blue: 105/255),
                                    Color(red: 16/255, green: 185/255, blue: 129/255)
                                ]), startPoint: .top, endPoint: .bottom),
                                style: StrokeStyle(lineWidth: family == .systemSmall ? 5 : 5, lineCap: .round)
                            )
                            .rotationEffect(.degrees(-90))
                            .padding(family == .systemSmall ? 6 : 7)
                    }
                    .frame(width: family == .systemSmall ? 60 : 65, height: family == .systemSmall ? 60 : 65)
                    
                    // Stats (Medium only)
                    if family == .systemMedium {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Total Expense")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(colorScheme == .dark 
                                    ? Color.gray 
                                    : Color(red: 71/255, green: 85/255, blue: 105/255))
                                .fixedSize(horizontal: false, vertical: true)
                            
                            Text("₹\(Int(safeExpense))")
                                .font(.system(size: 22, weight: .bold))
                                .foregroundColor(colorScheme == .dark 
                                    ? .white 
                                    : Color(red: 15/255, green: 23/255, blue: 42/255))
                                .lineLimit(1)
                                .minimumScaleFactor(0.8)
                                .shadow(color: colorScheme == .dark ? .clear : Color.black.opacity(0.1), radius: 1)
                            
                            if !safeMonth.isEmpty {
                                Text(safeMonth)
                                    .font(.system(size: 9, weight: .semibold))
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 3)
                                    .background(colorScheme == .dark 
                                        ? Color.white.opacity(0.08) 
                                        : Color(red: 51/255, green: 65/255, blue: 85/255).opacity(0.15))
                                    .cornerRadius(4)
                                    .foregroundColor(colorScheme == .dark 
                                        ? Color(red: 148/255, green: 163/255, blue: 184/255) 
                                        : Color(red: 51/255, green: 65/255, blue: 85/255))
                            }
                        }
                    }
                    Spacer()
                }
                
                Spacer()
                
                // Bottom Row: Budget Left (center) + Add Button (right)
                HStack(alignment: .bottom) {
                    // Budget Left - Multi-line format (Medium only)
                    if family == .systemMedium {
                        let remaining = max(0, safeBudget - safeExpense)
                        let isOverBudget = safeExpense > safeBudget
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Budget Left")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundColor(colorScheme == .dark 
                                    ? Color(red: 148/255, green: 163/255, blue: 184/255)
                                    : Color(red: 100/255, green: 116/255, blue: 139/255))
                            
                            Text("₹\(Int(remaining))")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(isOverBudget 
                                    ? Color(red: 239/255, green: 68/255, blue: 68/255)
                                    : (colorScheme == .dark 
                                        ? Color(red: 52/255, green: 211/255, blue: 153/255)
                                        : Color(red: 5/255, green: 150/255, blue: 105/255)))
                                .lineLimit(1)
                                .minimumScaleFactor(0.8)
                            
                            if safeBudget > 0 {
                                let percentage = min(100, Int((safeExpense / safeBudget) * 100))
                                Text("\(percentage)% used")
                                    .font(.system(size: 9, weight: .medium))
                                    .foregroundColor(colorScheme == .dark 
                                        ? Color(red: 100/255, green: 116/255, blue: 139/255)
                                        : Color(red: 71/255, green: 85/255, blue: 105/255))
                            }
                        }
                    }
                    
                    Spacer()
                    
                    // Add Button - BIGGER for small widget
                    Link(destination: URL(string: "budgetpro://add")!) {
                        VStack(spacing: 2) {
                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: family == .systemSmall ? 48 : 38, weight: .medium))
                                .symbolRenderingMode(.hierarchical)
                                .foregroundStyle(Color(red: 14/255, green: 165/255, blue: 233/255))
                            
                            if family == .systemMedium {
                                Text("Add")
                                    .font(.system(size: 10, weight: .semibold))
                                    .foregroundColor(colorScheme == .dark 
                                        ? Color(red: 148/255, green: 163/255, blue: 184/255)
                                        : Color(red: 71/255, green: 85/255, blue: 105/255))
                            }
                        }
                        .widgetAccentable()
                    }
                }
            }
        }
        .padding(family == .systemSmall ? 12 : 14)
        .containerBackground(for: .widget) {
            // Note: In iOS 26 Clear mode, this may be overridden by system glass effect
            // We use colors that work well even when blended
            Group {
                if colorScheme == .dark {
                    LinearGradient(
                        gradient: Gradient(colors: [
                            Color(red: 2/255, green: 6/255, blue: 23/255),
                            Color(red: 15/255, green: 23/255, blue: 42/255)
                        ]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                } else {
                    // Solid light background that works with glass overlay
                    Color(red: 248/255, green: 250/255, blue: 252/255).opacity(0.9) // slate-50
                }
            }
        }
        .widgetURL(URL(string: "budgetpro://add"))
    }
}

@main
struct BudgetWidget: Widget {
    let kind: String = "BudgetWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            BudgetWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Budget Pro Widget")
        .description("Quickly add expenses from your home screen.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct BudgetWidget_Previews: PreviewProvider {
    static var previews: some View {
        BudgetWidgetEntryView(entry: SimpleEntry(date: Date(), data: BudgetData(expense: 12000, income: 50000, budget: 30000, month: "Jan")))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}
