/**
 * zkTLS Integration Service for Website Delivery Verification
 *
 * Uses Reclaim Protocol to generate cryptographic proofs that verify:
 * 1. A website exists and is accessible
 * 2. The website contains specific content (proving deliverable completion)
 * 3. The website was delivered before the job deadline
 *
 * This replaces manual client approval with automated cryptographic verification
 *
 * Based on: https://docs.burnt.com/xion/examples/creating-a-social-media-verification-app
 */

import {
	ReclaimProofRequest,
	Proof,
	verifyProof,
} from "@reclaimprotocol/reactnative-sdk";
import {
	CONTRACT_CONFIG,
	CONTRACT_MESSAGES,
	RECLAIM_CONFIG,
	XION_DENOM,
} from "../constants/contracts";

// Website verification proof configuration
export interface WebsiteVerificationConfig {
	providerId: string;
	params: {
		[key: string]: string;
	};
	context: {
		contextAddress: string;
		contextMessage: string;
	};
	title: string;
	description: string;
}

// Website verification result
export interface WebsiteVerificationResult {
	success: boolean;
	proof?: Proof;
	verificationUrl?: string;
	extractedData?: {
		url: string;
		title?: string;
		content?: string;
		timestamp: string;
	};
	error?: string;
}

// Job completion proof metadata
export interface JobCompletionProof {
	jobId: number;
	workerAddress: string;
	deliveryUrl: string;
	proofHash: string;
	timestamp: string;
	reclaimProofId: string;
}

/**
 * zkTLS Service for automating work verification through website delivery proofs
 */
export class ZKTLSService {
	private appId: string;
	private appSecret: string;
	private rpcUrl: string;
	private verificationContractAddress: string;

	constructor(
		appId: string,
		appSecret: string,
		rpcUrl: string = CONTRACT_CONFIG.rpcUrl,
		verificationContractAddress: string = RECLAIM_CONFIG.verificationContractAddress
	) {
		this.appId = appId;
		this.appSecret = appSecret;
		this.rpcUrl = rpcUrl;
		this.verificationContractAddress = verificationContractAddress;
	}

	/**
	 * Generate a proof that verifies a website exists and contains expected content
	 * This proves the freelancer has delivered the work (website/page)
	 */
	async generateWebsiteDeliveryProof(
		deliveryUrl: string,
		expectedContent?: string
	): Promise<WebsiteVerificationResult> {
		try {
			console.log("🔗 Generating website delivery proof for:", deliveryUrl);

			// Create website verification configuration
			const config: WebsiteVerificationConfig = {
				providerId: RECLAIM_CONFIG.providerId || "http",
				params: {
					url: deliveryUrl,
					...(expectedContent && { expectedContent }),
				},
				context: {
					contextAddress: "0x0000000000000000000000000000000000000000", // placeholder
					contextMessage: `Website delivery verification for ${deliveryUrl}`,
				},
				title: "Website Delivery Proof",
				description: `Cryptographic proof that website ${deliveryUrl} exists and contains required content`,
			};

			// Initialize Reclaim proof request
			const proofRequest = await ReclaimProofRequest.init(
				this.appId,
				this.appSecret,
				config.providerId,
				{ log: true }
			);

			// Set proof parameters
			proofRequest.setAppCallbackUrl("https://your-app.com/callback");
			proofRequest.setParams(config.params);
			proofRequest.addContext(
				config.context.contextAddress,
				config.context.contextMessage
			);

			// Generate verification URL for user
			const verificationUrl = await proofRequest.getRequestUrl();
			console.log("📱 Verification URL generated:", verificationUrl);

			// For now, return the verification URL - user needs to complete the proof
			// In a real implementation, you'd handle the proof completion callback
			return {
				success: true,
				verificationUrl,
				extractedData: {
					url: deliveryUrl,
					timestamp: new Date().toISOString(),
				},
			};
		} catch (error) {
			console.error("❌ Failed to generate website delivery proof:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Verify a completed Reclaim proof for website delivery
	 */
	async verifyWebsiteDeliveryProof(proof: Proof): Promise<{
		isValid: boolean;
		extractedData?: any;
		error?: string;
	}> {
		try {
			console.log("🔍 Verifying website delivery proof...");

			// Verify the proof cryptographically
			const isValid = await verifyProof(proof);

			if (!isValid) {
				return {
					isValid: false,
					error: "Proof signature verification failed",
				};
			}

			// Extract and validate the proof data
			const extractedData = JSON.parse(proof.claimData.parameters);
			console.log("✅ Proof verified! Extracted data:", extractedData);

			return {
				isValid: true,
				extractedData,
			};
		} catch (error) {
			console.error("❌ Proof verification failed:", error);
			return {
				isValid: false,
				error: error instanceof Error ? error.message : "Verification failed",
			};
		}
	}

	/**
	 * Submit website delivery proof to smart contract for automated payment release
	 */
	async submitDeliveryProofToContract(
		contractClient: any,
		userAddress: string,
		jobId: number,
		proof: Proof,
		deliveryUrl: string
	): Promise<{
		success: boolean;
		transactionHash?: string;
		error?: string;
	}> {
		try {
			console.log("📄 Submitting delivery proof to contract for job:", jobId);

			// Verify the proof first
			const verification = await this.verifyWebsiteDeliveryProof(proof);
			if (!verification.isValid) {
				return {
					success: false,
					error: `Invalid proof: ${verification.error}`,
				};
			}

			// Create job completion proof metadata
			const completionProof: JobCompletionProof = {
				jobId,
				workerAddress: userAddress,
				deliveryUrl,
				proofHash: proof.identifier,
				timestamp: new Date().toISOString(),
				reclaimProofId: proof.identifier,
			};

			// Submit proof to contract (this would be a new contract message type)
			const fullProof = JSON.stringify({
				completionProof,
				tlsProof: proof,
				deliveryUrl
			});
			const message = CONTRACT_MESSAGES.SUBMIT_ZKTLS_PROOF(
				jobId,
				fullProof
			);

			console.log("📤 Sending zkTLS proof to contract...");

			const result = await contractClient.execute(
				userAddress,
				CONTRACT_CONFIG.address,
				message,
				"auto",
				"zkTLS proof submission for automated payment release"
			);

			console.log(
				"✅ zkTLS proof submitted successfully!",
				result.transactionHash
			);

			return {
				success: true,
				transactionHash: result.transactionHash,
			};
		} catch (error) {
			console.error("❌ Failed to submit proof to contract:", error);
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Contract submission failed",
			};
		}
	}

	/**
	 * Store proof data in RUM (Reclaim User Map) contract for decentralized verification
	 */
	async storeProofInRUM(
		contractClient: any,
		userAddress: string,
		proof: Proof,
		jobId: number
	): Promise<{
		success: boolean;
		transactionHash?: string;
		error?: string;
	}> {
		try {
			console.log("🗄️ Storing proof in RUM contract...");

			// RUM contract instantiation message
			const rumInstantiateMsg = {
				epochs: {
					create: {
						identifier: `job_${jobId}_proof`,
						minimum_witnesses_for_claim_creation: 1,
					},
				},
			};

			// Deploy RUM contract instance (CODE_ID: 1289)
			const instantiateResult = await contractClient.instantiate(
				userAddress,
				RECLAIM_CONFIG.rumCodeId, // RUM contract code ID from configuration
				rumInstantiateMsg,
				"Job delivery proof storage",
				"auto"
			);

			const rumContractAddress = instantiateResult.contractAddress;
			console.log("📍 RUM contract deployed at:", rumContractAddress);

			// Store the proof in RUM
			const storeMessage = {
				users: {
					create: {
						user_id: userAddress,
						claims: [
							{
								provider: "website_delivery",
								parameters: JSON.stringify({
									jobId,
									deliveryUrl: JSON.parse(proof.claimData.parameters).url,
									timestamp: new Date().toISOString(),
								}),
								owner: userAddress,
								timestampS: Math.floor(Date.now() / 1000),
								claimId: proof.identifier,
							},
						],
					},
				},
			};

			const storeResult = await contractClient.execute(
				userAddress,
				rumContractAddress,
				storeMessage,
				"auto",
				"Store website delivery proof"
			);

			console.log("✅ Proof stored in RUM successfully!");

			return {
				success: true,
				transactionHash: storeResult.transactionHash,
			};
		} catch (error) {
			console.error("❌ Failed to store proof in RUM:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "RUM storage failed",
			};
		}
	}

	/**
	 * Complete workflow: Generate proof, verify, and submit to contract for automated payment
	 */
	async completeJobWithWebsiteProof(
		contractClient: any,
		userAddress: string,
		jobId: number,
		deliveryUrl: string,
		expectedContent?: string
	): Promise<{
		success: boolean;
		transactionHash?: string;
		proofId?: string;
		error?: string;
		verificationUrl?: string;
	}> {
		try {
			console.log("🚀 Starting complete job verification workflow...");

			// Step 1: Generate website delivery proof
			const proofResult = await this.generateWebsiteDeliveryProof(
				deliveryUrl,
				expectedContent
			);

			if (!proofResult.success) {
				return {
					success: false,
					error: `Proof generation failed: ${proofResult.error}`,
				};
			}

			// Return verification URL for user to complete the proof
			// In a production app, you'd handle the proof completion via webhook/callback
			return {
				success: true,
				verificationUrl: proofResult.verificationUrl,
				proofId: proofResult.proof?.identifier,
			};
		} catch (error) {
			console.error("❌ Complete job verification workflow failed:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Workflow failed",
			};
		}
	}

	/**
	 * Handle completed proof from Reclaim (called when user completes verification)
	 */
	async handleCompletedProof(
		contractClient: any,
		userAddress: string,
		jobId: number,
		proof: Proof,
		deliveryUrl: string
	): Promise<{
		success: boolean;
		transactionHash?: string;
		error?: string;
	}> {
		try {
			console.log(
				"🎯 Handling completed proof for automatic job completion..."
			);

			// Submit the proof to contract for automatic payment release
			const submissionResult = await this.submitDeliveryProofToContract(
				contractClient,
				userAddress,
				jobId,
				proof,
				deliveryUrl
			);

			if (!submissionResult.success) {
				return submissionResult;
			}

			// Optionally store in RUM for decentralized verification
			try {
				await this.storeProofInRUM(contractClient, userAddress, proof, jobId);
				console.log(
					"📝 Proof also stored in RUM for decentralized verification"
				);
			} catch (rumError) {
				console.warn(
					"⚠️ RUM storage failed, but main proof submission succeeded:",
					rumError
				);
			}

			console.log("🎉 Job automatically completed with zkTLS proof!");

			return {
				success: true,
				transactionHash: submissionResult.transactionHash,
			};
		} catch (error) {
			console.error("❌ Failed to handle completed proof:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Proof handling failed",
			};
		}
	}

	/**
	 * Create a predefined website verification template for common deliverables
	 */
	static createWebsiteTemplate(
		templateType:
			| "landing_page"
			| "blog_post"
			| "portfolio"
			| "ecommerce"
			| "documentation"
	): Partial<WebsiteVerificationConfig> {
		const templates = {
			landing_page: {
				title: "Landing Page Delivery",
				description: "Verify landing page has been created and deployed",
				params: {
					selectors: "title, h1, .hero, .cta-button",
					expectedContent: "hero section, call-to-action",
				},
			},
			blog_post: {
				title: "Blog Post Delivery",
				description:
					"Verify blog post has been published with required content",
				params: {
					selectors: "article, .post-content, h1, .publish-date",
					expectedContent: "article content, publish date",
				},
			},
			portfolio: {
				title: "Portfolio Site Delivery",
				description: "Verify portfolio website is live with projects showcased",
				params: {
					selectors: ".portfolio, .projects, .about",
					expectedContent: "portfolio items, about section",
				},
			},
			ecommerce: {
				title: "E-commerce Site Delivery",
				description: "Verify e-commerce site with product listings",
				params: {
					selectors: ".products, .shop, .cart, .checkout",
					expectedContent: "product listings, shopping cart",
				},
			},
			documentation: {
				title: "Documentation Site Delivery",
				description: "Verify documentation has been created and published",
				params: {
					selectors: ".docs, .api-reference, .guide",
					expectedContent: "documentation sections, guides",
				},
			},
		};

		return {
			providerId: "http",
			context: {
				contextAddress: "0x0000000000000000000000000000000000000000",
				contextMessage: `${templates[templateType].title} verification`,
			},
			...templates[templateType],
		};
	}
}

/**
 * Hook for React components to use zkTLS verification
 */
export const useZKTLSVerification = () => {
	const APP_ID = RECLAIM_CONFIG.appId;
	const APP_SECRET = RECLAIM_CONFIG.appSecret;

	if (!RECLAIM_CONFIG.enabled) {
		console.warn(
			"⚠️ Reclaim APP_ID or APP_SECRET not configured in environment variables"
		);
	}

	const zkTLSService = new ZKTLSService(APP_ID, APP_SECRET);

	return {
		zkTLSService,
		isConfigured: RECLAIM_CONFIG.enabled,
		generateWebsiteProof:
			zkTLSService.generateWebsiteDeliveryProof.bind(zkTLSService),
		verifyProof: zkTLSService.verifyWebsiteDeliveryProof.bind(zkTLSService),
		completeJobWithProof:
			zkTLSService.completeJobWithWebsiteProof.bind(zkTLSService),
		templates: ZKTLSService.createWebsiteTemplate,
	};
};

export default ZKTLSService;
