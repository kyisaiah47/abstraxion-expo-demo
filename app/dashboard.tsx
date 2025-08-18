import { View, SafeAreaView, ActivityIndicator } from "react-native";
import * as Clipboard from "expo-clipboard";
import {
	useAbstraxionAccount,
	useAbstraxionSigningClient,
} from "@burnt-labs/abstraxion-react-native";
import Toast from "react-native-toast-message";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "expo-router";
import ProofSubmissionSheet from "./jobs/[id]/proof-submission";
import QRScanner from "./qr-scanner";
import JobCreateSheet from "./create";
import { styles } from "./dashboard.styles";
import ProfileRow from "../components/ProfileRow";
import MetricsRow from "../components/MetricsRow";
import ActiveJobCard from "../components/ActiveJobCard";
import BottomActions from "../components/BottomActions";
import { Modalize } from "react-native-modalize";

// === BEGIN: XION FETCH LOGIC ===
const CONTRACT_ADDRESS =
	"xion1d7zer33uxd3u8cp8e4huck03z0gg6v2kv02n088yrgg5qkwxsfnqxnvxvt";
const API_URL = `https://api.xion-testnet-2.burnt.com/cosmwasm/wasm/v1/contract/${CONTRACT_ADDRESS}/smart/${btoa(
	JSON.stringify({ ListJobs: {} })
)}`;

async function fetchJobsFromChain() {
	try {
		const res = await fetch(API_URL, { method: "GET" });
		const json = await res.json();
		return json.data?.jobs ?? [];
	} catch (e) {
		console.warn("Failed to fetch jobs:", e);
		return [];
	}
}
// === END: XION FETCH LOGIC ===

type CreateJobInput = { description: string };

export default function DashboardScreen() {
	const [showScanner, setShowScanner] = useState(false);
	const { data, logout } = useAbstraxionAccount();
	const { client } = useAbstraxionSigningClient();
	const router = useRouter();
	const modalRef = useRef<Modalize>(null);
	const createModalRef = useRef<Modalize>(null);
	const [jobs, setJobs] = useState([]);
	const [loadingJobs, setLoadingJobs] = useState(true);
	const [activeJob, setActiveJob] = useState(null);
	const [postingJob, setPostingJob] = useState(false);

	function truncateAddress(address: string | undefined | null): string {
		if (!address) return "";
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}

	const copyToClipboard = async () => {
		if (data?.bech32Address) {
			await Clipboard.setStringAsync(data?.bech32Address);
			Toast.show({
				type: "success",
				text1: "Copied",
				text2: "Wallet address copied",
				position: "bottom",
			});
		}
	};

	const handleLogout = async () => {
		await logout();
		Toast.show({
			type: "success",
			text1: "Logged out",
			text2: "You have been disconnected.",
			position: "bottom",
		});
		router.replace("/");
	};

	const handleSubmitProof = () => {
		Toast.show({
			type: "success",
			text1: "Proof submitted!",
			position: "bottom",
		});
		(modalRef.current as any)?.close && modalRef.current?.close();
	};

	const handleScanQR = () => setShowScanner(true);

	const handleScanned = (data: string) => {
		alert(`QR Code: ${data}`);
		setShowScanner(false);
	};

	const handleCreateJob = async ({ description }: CreateJobInput) => {
		setPostingJob(true);
		try {
			await postJobToChain(description, data?.bech32Address);
			Toast.show({ type: "success", text1: "Job Created" });
			(createModalRef.current as any)?.close && createModalRef.current?.close();
			// Refresh jobs!
			setLoadingJobs(true);
			const jobs = await fetchJobsFromChain();
			setJobs(jobs);
			setActiveJob(jobs.find((j: any) => !j.accepted) || null);
		} catch (e: any) {
			console.error("Chain execute failed:", e);
			Toast.show({
				type: "error",
				text1: "Failed to create job",
				text2: e?.message || String(e),
			});
		} finally {
			setPostingJob(false);
		}
	};

	// === THE ACTUAL CHAIN CALL ===
	async function postJobToChain(description, sender) {
		if (!client || !sender) throw new Error("Wallet not connected");
		console.log("Sender:", sender);
		console.log("Client:", client);
		const msg = { post_job: { description } };
		try {
			const tx = await client.execute(sender, CONTRACT_ADDRESS, msg, "auto");
			return tx;
		} catch (e) {
			console.error("Chain execute failed:", e);
			throw e;
		}
	}

	// --- Fetch jobs from XION on mount ---
	useEffect(() => {
		let mounted = true;
		setLoadingJobs(true);
		fetchJobsFromChain().then((jobs) => {
			if (!mounted) return;
			setJobs(jobs);
			setActiveJob(jobs.find((j: any) => !j.accepted) || null);
			setLoadingJobs(false);
		});
		return () => {
			mounted = false;
		};
	}, []);

	if (showScanner) {
		return (
			<QRScanner
				onScanned={handleScanned}
				onCancel={() => setShowScanner(false)}
			/>
		);
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<ProfileRow
					data={data}
					copyToClipboard={copyToClipboard}
					handleLogout={handleLogout}
					truncateAddress={truncateAddress}
				/>
				<MetricsRow
					loadingJobs={loadingJobs}
					jobs={jobs}
				/>
				<View style={{ flex: 1, width: "100%" }}>
					{loadingJobs ? (
						<ActivityIndicator
							size="large"
							style={{ marginTop: 40 }}
						/>
					) : (
						<ActiveJobCard
							activeJob={activeJob}
							modalRef={modalRef}
							truncateAddress={truncateAddress}
						/>
					)}
				</View>
				<BottomActions
					handleScanQR={handleScanQR}
					createModalRef={createModalRef}
				/>
				<Modalize
					ref={modalRef}
					adjustToContentHeight
					handlePosition="inside"
				>
					<ProofSubmissionSheet
						job={activeJob}
						onSubmit={handleSubmitProof}
					/>
				</Modalize>
				<Modalize
					ref={createModalRef}
					adjustToContentHeight
					handlePosition="inside"
				>
					<JobCreateSheet
						onCreate={handleCreateJob}
						creating={postingJob}
					/>
				</Modalize>
			</View>
		</SafeAreaView>
	);
}
