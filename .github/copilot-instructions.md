# Copilot Instructions for PET-Toolkit (Proof-of-Work Social Payment App)

## Architecture Overview

- **React Native + Expo Router**: Mobile-first, cross-platform app with tab-based navigation in `app/(tabs)/`.
- **Smart Contract Integration**: All payments, requests, and proofs are managed via XION blockchain contracts (see `lib/socialContract.ts`).
- **Abstraxion Wallet**: Used for authentication and signing transactions (`@burnt-labs/abstraxion-react-native`).
- **Design System**: Consistent UI via `constants/DesignSystem.ts` and `constants/Colors.ts`.

## Key Patterns & Conventions

- **Payment Flows**: Three main flows—Help, Request, Pay—are handled in `app/(tabs)/create.tsx` and related components.
- **Proof-of-Work**: Payments can require proof (None, Text, Photo, zkTLS). Proof submission logic is in payment detail screens and contract hooks.
- **Contract Hooks**: All blockchain interactions use custom hooks in `hooks/useSocialContract.ts`. Always use these for reading/writing contract state.
- **User Data**: User objects from contracts use snake_case (e.g., `wallet_address`, `display_name`). Map to UI types as needed.
- **Activity Feed**: Recent payments and requests are shown in `app/(tabs)/activity.tsx` using contract data.
- **Friends Management**: Contract-based friends logic in `app/(tabs)/friends.tsx`.

## Developer Workflows

- **Start App**: `npx expo start` (see README for platform-specific commands)
- **Install Dependencies**: `npm install`
- **Photo Upload**: Uses `expo-image-picker` for proof photo type
- **Smart Contract**: All contract calls go through `SocialPaymentContract` (see `lib/socialContract.ts`)
- **Wallet Auth**: Use `useAbstraxionAccount()` for wallet state and address

## Integration Points

- **XION Blockchain**: All payments, requests, and proofs are cryptographically secured and recorded
- **Abstraxion**: Wallet authentication and transaction signing
- **zkTLS**: Advanced proof type, see integration in payment detail screens

## Project-Specific Tips

- **Type Mapping**: Always map contract User/Payment objects to UI types (snake_case to camelCase)
- **Error Handling**: Use loading/error states from contract hooks for robust UX
- **Component Structure**: UI components are in `components/`, screens in `app/(tabs)/`, and contract logic in `hooks/`
- **Design System**: Use `DesignSystem` for colors, spacing, and typography

## Example: Contract Hook Usage

```ts
const { friends, loading, error, refetch } = useUserFriends(username);
const { sendFriendRequest } = useSocialOperations(address);
```

## Key Files & Directories

- `app/(tabs)/` — Main screens (create, activity, friends, profile)
- `components/` — UI components
- `hooks/useSocialContract.ts` — Contract hooks
- `lib/socialContract.ts` — Contract client and types
- `constants/DesignSystem.ts` — UI design system
- `README.md` — Developer onboarding and workflow

---

## Copilot Behavioral Rules (Critical)

- Do not explain changes.
- Do not say “Here’s what needs to be fixed.”
- Always make the edits directly in code.
- Always return the complete updated file (or diff).
- Never ask me to apply changes manually.
- Apply all requested changes in full before responding.
  Keep editing until the implementation is consistent and complete.

---

**Feedback:** If any section is unclear or missing, please specify what needs improvement or additional detail.
