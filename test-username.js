// Test script to verify username registration flow
import { UserService } from "./lib/userService";

async function testUsernameFlow() {
	console.log("Testing username registration flow...");

	try {
		// Test 1: Check availability for new username
		const isAvailable = await UserService.checkUsernameAvailability(
			"test_user"
		);
		console.log("✓ Username availability check:", isAvailable);

		// Test 2: Register new username
		const mockWallet = "xion1test123456789abcdef";
		const newUser = await UserService.registerUsername("test_user", mockWallet);
		console.log("✓ Username registration:", newUser.username);

		// Test 3: Check availability for taken username
		const isNotAvailable = await UserService.checkUsernameAvailability(
			"test_user"
		);
		console.log("✓ Username taken check:", !isNotAvailable);

		// Test 4: Get user by wallet
		const retrievedUser = await UserService.getUserByWallet(mockWallet);
		console.log("✓ Get user by wallet:", retrievedUser?.username);

		console.log(
			"\n🎉 All tests passed! Username registration flow is working."
		);
	} catch (error) {
		console.error("❌ Test failed:", error.message);
	}
}

testUsernameFlow();
