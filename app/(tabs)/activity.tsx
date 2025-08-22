import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import SophisticatedHeader from '@/components/SophisticatedHeader';
import BalanceCard from '@/components/BalanceCard';
import PaymentRow from '@/components/PaymentRow';
import InfoCard from '@/components/InfoCard';
import { DesignSystem } from '@/constants/DesignSystem';
import { Payment } from '@/types/proofpay';

export default function PaymentsScreen() {
  // Mock data - will be replaced with real data
  const userBalance = {
    total: 1250.75,
    awaitingAmount: 150.00,
    verifiedCount: 8,
  };

  const payments: Payment[] = [
    {
      id: '1',
      title: 'Coffee Shop Photo',
      subtitle: 'Starbucks verification task',
      amount: 5.00,
      direction: 'in',
      status: 'Proof Confirmed',
      timeAgo: '2 hours ago',
    },
    {
      id: '2',
      title: 'Survey Completion',
      subtitle: 'Product feedback survey',
      amount: 12.50,
      direction: 'in',
      status: 'Awaiting Proof',
      timeAgo: '1 day ago',
    },
    {
      id: '3',
      title: 'Receipt Upload',
      subtitle: 'Grocery store receipt',
      amount: 3.00,
      direction: 'in',
      status: 'Payment Sent',
      timeAgo: '3 days ago',
    },
  ];

  const handleStartTask = () => {
    router.push('/(tabs)/create');
  };

  const renderEmptyState = () => (
    <InfoCard
      title="No Proof, No Payment"
      body="Mathematical verification eliminates payment disputes. Every task completion is cryptographically verified."
      icon="shield-checkmark"
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SophisticatedHeader
        title="Verified Payments"
        subtitle="Your cryptographically secured transactions"
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <BalanceCard
          total={userBalance.total}
          awaitingAmount={userBalance.awaitingAmount}
          verifiedCount={userBalance.verifiedCount}
          ctaLabel="+ Start Task"
          onPressCta={handleStartTask}
        />

        {/* Latest Proofs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Proofs</Text>
          
          {payments.length > 0 ? (
            <View style={styles.paymentsList}>
              {payments.map((payment) => (
                <PaymentRow
                  key={payment.id}
                  title={payment.title}
                  subtitle={payment.subtitle}
                  amount={payment.amount}
                  direction={payment.direction}
                  status={payment.status}
                  timeAgo={payment.timeAgo}
                />
              ))}
            </View>
          ) : (
            renderEmptyState()
          )}
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.surface.primary,
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingHorizontal: DesignSystem.layout.containerPadding,
    paddingTop: DesignSystem.spacing['2xl'],
  },

  section: {
    marginBottom: DesignSystem.spacing['4xl'],
  },

  sectionTitle: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing['2xl'],
  },

  paymentsList: {
    gap: DesignSystem.spacing.md,
  },

  bottomSpacer: {
    height: 140, // Space for tab bar
  },
});
