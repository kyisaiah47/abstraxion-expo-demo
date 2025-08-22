import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import SophisticatedHeader from '@/components/SophisticatedHeader';
import { DesignSystem } from '@/constants/DesignSystem';

interface UserStats {
  jobsCompleted: number;
  totalEarnings: number;
  successRate: number;
  rating: number;
  reviewsCount: number;
}

interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: string;
  badge?: string;
  hasToggle?: boolean;
  isEnabled?: boolean;
}

export default function SophisticatedProfile() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const userStats: UserStats = {
    jobsCompleted: 47,
    totalEarnings: 2485.50,
    successRate: 98.2,
    rating: 4.9,
    reviewsCount: 23,
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile-settings',
          title: 'Profile Settings',
          subtitle: 'Edit your personal information',
          icon: 'person-outline',
          action: 'profile-settings',
        },
        {
          id: 'payment-methods',
          title: 'Payment Methods',
          subtitle: 'Manage your payment options',
          icon: 'card-outline',
          action: 'payment-methods',
        },
        {
          id: 'verification',
          title: 'Identity Verification',
          subtitle: 'Verify your identity for higher limits',
          icon: 'shield-checkmark-outline',
          action: 'verification',
          badge: 'Verified',
        },
      ] as MenuItem[],
    },
    {
      title: 'Work',
      items: [
        {
          id: 'job-history',
          title: 'Job History',
          subtitle: 'View all your completed jobs',
          icon: 'list-outline',
          action: 'job-history',
        },
        {
          id: 'earnings',
          title: 'Earnings & Reports',
          subtitle: 'Detailed earnings breakdown',
          icon: 'analytics-outline',
          action: 'earnings',
        },
        {
          id: 'reviews',
          title: 'Reviews & Ratings',
          subtitle: 'Feedback from clients',
          icon: 'star-outline',
          action: 'reviews',
        },
      ] as MenuItem[],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Get notified about new opportunities',
          icon: 'notifications-outline',
          action: 'notifications',
          hasToggle: true,
          isEnabled: notificationsEnabled,
        },
        {
          id: 'dark-mode',
          title: 'Dark Mode',
          subtitle: 'Use dark theme interface',
          icon: 'moon-outline',
          action: 'dark-mode',
          hasToggle: true,
          isEnabled: darkModeEnabled,
        },
        {
          id: 'language',
          title: 'Language',
          subtitle: 'English (US)',
          icon: 'language-outline',
          action: 'language',
        },
      ] as MenuItem[],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help-center',
          title: 'Help Center',
          subtitle: 'Get help and support',
          icon: 'help-circle-outline',
          action: 'help-center',
        },
        {
          id: 'contact',
          title: 'Contact Support',
          subtitle: 'Get in touch with our team',
          icon: 'mail-outline',
          action: 'contact',
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Help us improve the app',
          icon: 'chatbubble-outline',
          action: 'feedback',
        },
      ] as MenuItem[],
    },
    {
      title: 'Legal',
      items: [
        {
          id: 'privacy',
          title: 'Privacy Policy',
          icon: 'lock-closed-outline',
          action: 'privacy',
        },
        {
          id: 'terms',
          title: 'Terms of Service',
          icon: 'document-text-outline',
          action: 'terms',
        },
        {
          id: 'licenses',
          title: 'Open Source Licenses',
          icon: 'code-outline',
          action: 'licenses',
        },
      ] as MenuItem[],
    },
  ];

  const handleMenuAction = (action: string, item?: MenuItem) => {
    switch (action) {
      case 'notifications':
        setNotificationsEnabled(!notificationsEnabled);
        break;
      case 'dark-mode':
        setDarkModeEnabled(!darkModeEnabled);
        break;
      case 'profile-settings':
        // TODO: Navigate to profile settings
        break;
      case 'job-history':
        router.push('/recent-activity');
        break;
      case 'earnings':
        // TODO: Navigate to earnings
        break;
      default:
        console.log(`Action: ${action}`);
    }
  };

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <LinearGradient
        colors={[DesignSystem.colors.primary[700], DesignSystem.colors.primary[900]]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.statsContent}>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.jobsCompleted}</Text>
            <Text style={styles.statLabel}>Jobs Completed</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              ${userStats.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.successRate}%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={styles.ratingContainer}>
              <Text style={styles.statValue}>{userStats.rating}</Text>
              <Ionicons name="star" size={20} color={DesignSystem.colors.text.inverse} />
            </View>
            <Text style={styles.statLabel}>{userStats.reviewsCount} Reviews</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderMenuItem = (item: MenuItem) => (
    <Pressable
      key={item.id}
      style={styles.menuItem}
      onPress={() => handleMenuAction(item.action, item)}
    >
      <View style={styles.menuItemIcon}>
        <Ionicons
          name={item.icon}
          size={20}
          color={DesignSystem.colors.text.secondary}
        />
      </View>
      
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemText}>
          <Text style={styles.menuItemTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
          )}
        </View>
        
        <View style={styles.menuItemAction}>
          {item.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          )}
          
          {item.hasToggle ? (
            <Switch
              value={item.isEnabled}
              onValueChange={() => handleMenuAction(item.action, item)}
              trackColor={{
                false: DesignSystem.colors.border.primary,
                true: DesignSystem.colors.primary[800],
              }}
              thumbColor={DesignSystem.colors.surface.elevated}
            />
          ) : (
            <Ionicons
              name="chevron-forward"
              size={16}
              color={DesignSystem.colors.text.tertiary}
            />
          )}
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SophisticatedHeader
        title="Profile"
        subtitle="Manage your account and preferences"
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://via.placeholder.com/120/2563EB/FFFFFF?text=JD' }}
              style={styles.avatar}
            />
            <Pressable style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color={DesignSystem.colors.text.inverse} />
            </Pressable>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>John Doe</Text>
            <Text style={styles.profileEmail}>john.doe@example.com</Text>
            <Text style={styles.profileJoined}>Member since January 2024</Text>
          </View>
        </View>

        {/* Stats Card */}
        {renderStatsCard()}

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <View key={item.id}>
                  {renderMenuItem(item)}
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.menuSeparator} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <Pressable style={styles.logoutButton}>
            <Ionicons
              name="log-out-outline"
              size={20}
              color={DesignSystem.colors.status.error}
            />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Version 1.0.0 (Build 1)</Text>
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
  
  // Profile Header
  profileHeader: {
    alignItems: 'center',
    marginBottom: DesignSystem.spacing['4xl'],
    gap: DesignSystem.spacing['2xl'],
  },
  
  avatarContainer: {
    position: 'relative',
  },
  
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: DesignSystem.colors.surface.elevated,
    ...DesignSystem.shadows.lg,
  },
  
  editAvatarButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignSystem.colors.primary[800],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: DesignSystem.colors.surface.elevated,
  },
  
  profileInfo: {
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
  },
  
  profileName: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.text.primary,
  },
  
  profileEmail: {
    ...DesignSystem.typography.body.medium,
    color: DesignSystem.colors.text.secondary,
  },
  
  profileJoined: {
    ...DesignSystem.typography.body.small,
    color: DesignSystem.colors.text.tertiary,
  },
  
  // Stats Card
  statsCard: {
    borderRadius: DesignSystem.radius.xl,
    marginBottom: DesignSystem.spacing['4xl'],
    overflow: 'hidden',
    ...DesignSystem.shadows.lg,
  },
  
  statsContent: {
    padding: DesignSystem.spacing['3xl'],
  },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing['2xl'],
  },
  
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
  },
  
  statValue: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.inverse,
  },
  
  statLabel: {
    ...DesignSystem.typography.body.small,
    color: DesignSystem.colors.text.inverse,
    opacity: 0.9,
    textAlign: 'center',
  },
  
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
  },
  
  // Menu Sections
  menuSection: {
    marginBottom: DesignSystem.spacing['4xl'],
  },
  
  sectionTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xl,
  },
  
  menuCard: {
    backgroundColor: DesignSystem.colors.surface.elevated,
    borderRadius: DesignSystem.radius.xl,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.secondary,
    ...DesignSystem.shadows.sm,
    overflow: 'hidden',
  },
  
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing['2xl'],
    gap: DesignSystem.spacing.xl,
  },
  
  menuSeparator: {
    height: 1,
    backgroundColor: DesignSystem.colors.border.tertiary,
    marginLeft: 72, // Icon width + gap
  },
  
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: DesignSystem.radius.lg,
    backgroundColor: DesignSystem.colors.surface.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  menuItemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  menuItemText: {
    flex: 1,
    gap: DesignSystem.spacing.xs,
  },
  
  menuItemTitle: {
    ...DesignSystem.typography.label.large,
    color: DesignSystem.colors.text.primary,
  },
  
  menuItemSubtitle: {
    ...DesignSystem.typography.body.small,
    color: DesignSystem.colors.text.secondary,
  },
  
  menuItemAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.md,
  },
  
  badge: {
    backgroundColor: DesignSystem.colors.status.success + '20',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.radius.md,
  },
  
  badgeText: {
    ...DesignSystem.typography.label.small,
    color: DesignSystem.colors.status.success,
  },
  
  // Logout Section
  logoutSection: {
    marginBottom: DesignSystem.spacing['2xl'],
  },
  
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSystem.spacing.xl,
    backgroundColor: DesignSystem.colors.surface.elevated,
    borderRadius: DesignSystem.radius.xl,
    borderWidth: 1,
    borderColor: DesignSystem.colors.status.error + '30',
    gap: DesignSystem.spacing.md,
  },
  
  logoutText: {
    ...DesignSystem.typography.label.large,
    color: DesignSystem.colors.status.error,
  },
  
  // Version Section
  versionSection: {
    alignItems: 'center',
    marginBottom: DesignSystem.spacing['2xl'],
  },
  
  versionText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.tertiary,
  },
  
  bottomSpacer: {
    height: 140, // Space for tab bar
  },
});
