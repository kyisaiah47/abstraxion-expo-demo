import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { DesignSystem } from '@/constants/DesignSystem';

export default function NotFoundScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[styles.container, { backgroundColor: colors.surface.primary }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>This screen doesn&apos;t exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.accent?.primary || colors.primary[700] }]}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSystem.spacing.xl,
  },
  title: {
    ...DesignSystem.typography.h2,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  link: {
    marginTop: DesignSystem.spacing.lg,
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.radius.md,
  },
  linkText: {
    ...DesignSystem.typography.bodyMedium,
    fontWeight: '600',
    textAlign: 'center',
  },
});
