# EagleTech Mobile App - Agent Instructions & Architecture Plan

## Executive Summary
This document serves as the architectural blueprint and prompt context for building the EagleTech mobile app. The mobile app will serve as the native counterpart to the existing EagleTech Next.js web application.

## Framework Choice: React Native (Expo)
We have selected **React Native with Expo** over Flutter.
**Why?**
1. **Code Reusability**: The web app is built with React and TypeScript. React Native allows us to share business logic, custom hooks, TypeScript interfaces, and Zustand state management patterns directly.
2. **Supabase Compatibility**: Supabase-JS works identically in React Native as it does in Next.js (simply requiring an async storage adapter).
3. **Physical Device Execution**: Expo provides the fastest path to running the app on a physical phone via the Expo Go app or EAS Build, fulfilling the requirement for a launchable app icon.

## Core Requirements & Strategy
### 1. Shared Backend & Auth
- **Database**: Both web and mobile will point to the identical Supabase project URL and Anon Key.
- **Authentication**: We will use \`@supabase/supabase-js\` with \`@react-native-async-storage/async-storage\` for persistent local auth sessions. User credentials (`doncyco123@gmail.com`) will work interchangeably.

### 2. Cart Synchronization (Web <-> Mobile)
Currently, the Next.js web app stores the cart entirely locally via Zustand's \`localStorage\` persist middleware. To achieve true cross-device synchronization:
- **Phase 1 (Database Migration)**: We will create a \`cart_items\` table in Supabase.
- **Phase 2 (Store Refactor)**: We will modify the \`useCartStore\` on the Web to sync its local state to the Supabase \`cart_items\` table in real-time.
- **Phase 3 (Mobile Implementation)**: The mobile app will subscribe to the \`cart_items\` table using Supabase Realtime, immediately reflecting items added from the web app, and vice-versa.

## Directory Structure
- Web App: \`/Users/macbook/Downloads/FrontEnd_Training/eagletech-store\`
- Mobile App: \`/Users/macbook/Downloads/FrontEnd_Training/eagletech-mobile\`

## Next Steps for Mobile Implementation
1. Initialize the Expo router and bottom tab navigation.
2. Install Supabase SDK and Async Storage.
3. Scaffold the Login/Register screens.
4. Scaffold the Product Feed (fetching from the shared \`products\` table).
5. Implement the Cart sync logic.
