import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import SophisticatedHeader from '@/components/SophisticatedHeader';
import { DesignSystem } from '@/constants/DesignSystem';

interface Job {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'freelance';
  salary: {
    min: number;
    max: number;
    currency: string;
    period: 'hour' | 'day' | 'month' | 'year' | 'project';
  };
  tags: string[];
  postedAt: string;
  deadline?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  featured?: boolean;
}

const SAMPLE_JOBS: Job[] = [
  {
    id: '1',
    title: 'Data Entry Specialist',
    description: 'Looking for detail-oriented individuals to help with data entry tasks. Clean and organize customer information databases.',
    company: 'TechCorp Solutions',
    location: 'Remote',
    type: 'freelance',
    salary: { min: 15, max: 25, currency: 'USD', period: 'hour' },
    tags: ['Data Entry', 'Excel', 'Attention to Detail'],
    postedAt: '2 hours ago',
    deadline: '3 days',
    difficulty: 'beginner',
    featured: true,
  },
  {
    id: '2',
    title: 'Content Moderation',
    description: 'Review and moderate user-generated content according to community guidelines. Ensure platform safety and quality.',
    company: 'Social Media Inc',
    location: 'Remote',
    type: 'contract',
    salary: { min: 18, max: 22, currency: 'USD', period: 'hour' },
    tags: ['Content Review', 'Moderation', 'Policy'],
    postedAt: '4 hours ago',
    difficulty: 'intermediate',
  },
  {
    id: '3',
    title: 'Image Verification Task',
    description: 'Verify and categorize images for machine learning training datasets. Help improve AI accuracy.',
    company: 'AI Research Lab',
    location: 'Remote',
    type: 'freelance',
    salary: { min: 20, max: 30, currency: 'USD', period: 'hour' },
    tags: ['AI', 'Image Processing', 'Quality Assurance'],
    postedAt: '1 day ago',
    deadline: '5 days',
    difficulty: 'intermediate',
  },
  {
    id: '4',
    title: 'Survey Data Collection',
    description: 'Collect and validate survey responses. Ensure data quality and completeness for market research.',
    company: 'Market Insights',
    location: 'Remote',
    type: 'part-time',
    salary: { min: 12, max: 18, currency: 'USD', period: 'hour' },
    tags: ['Surveys', 'Data Collection', 'Research'],
    postedAt: '2 days ago',
    difficulty: 'beginner',
  },
];

const JOB_FILTERS = [
  { id: 'all', label: 'All Jobs', icon: 'grid' as const },
  { id: 'featured', label: 'Featured', icon: 'star' as const },
  { id: 'recent', label: 'Recent', icon: 'time' as const },
  { id: 'high-pay', label: 'High Pay', icon: 'trending-up' as const },
];

export default function SophisticatedMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [jobs, setJobs] = useState<Job[]>(SAMPLE_JOBS);

  const handleJobPress = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  const getJobTypeColor = (type: Job['type']) => {
    switch (type) {
      case 'full-time':
        return DesignSystem.colors.status.success;
      case 'part-time':
        return DesignSystem.colors.status.info;
      case 'contract':
        return DesignSystem.colors.status.warning;
      case 'freelance':
        return DesignSystem.colors.primary[700];
      default:
        return DesignSystem.colors.text.secondary;
    }
  };

  const getDifficultyColor = (difficulty: Job['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return DesignSystem.colors.status.success;
      case 'intermediate':
        return DesignSystem.colors.status.warning;
      case 'advanced':
        return DesignSystem.colors.status.error;
      default:
        return DesignSystem.colors.text.secondary;
    }
  };

  const formatSalary = (salary: Job['salary']) => {
    const range = salary.min === salary.max 
      ? `$${salary.min}` 
      : `$${salary.min}-${salary.max}`;
    return `${range}/${salary.period}`;
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'featured') return matchesSearch && job.featured;
    if (activeFilter === 'recent') return matchesSearch; // Could add time-based filtering
    if (activeFilter === 'high-pay') return matchesSearch && job.salary.min >= 20;
    
    return matchesSearch;
  });

  const renderJobCard = ({ item: job, index }: { item: Job; index: number }) => (
    <Pressable
      style={[
        styles.jobCard,
        job.featured && styles.featuredJobCard,
      ]}
      onPress={() => handleJobPress(job.id)}
    >
      {job.featured && (
        <View style={styles.featuredBadge}>
          <Ionicons name="star" size={12} color={DesignSystem.colors.text.inverse} />
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      )}
      
      <View style={styles.jobCardHeader}>
        <View style={styles.jobTitleContainer}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.jobCompany}>{job.company}</Text>
        </View>
        
        <View style={styles.jobMeta}>
          <Text style={styles.jobSalary}>{formatSalary(job.salary)}</Text>
          <View style={[
            styles.difficultyBadge,
            { backgroundColor: getDifficultyColor(job.difficulty) + '20' }
          ]}>
            <Text style={[
              styles.difficultyText,
              { color: getDifficultyColor(job.difficulty) }
            ]}>
              {job.difficulty}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.jobDescription} numberOfLines={2}>
        {job.description}
      </Text>
      
      <View style={styles.jobTags}>
        {job.tags.slice(0, 3).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        {job.tags.length > 3 && (
          <Text style={styles.moreTags}>+{job.tags.length - 3} more</Text>
        )}
      </View>
      
      <View style={styles.jobFooter}>
        <View style={styles.jobInfo}>
          <View style={styles.jobInfoItem}>
            <Ionicons name="location-outline" size={14} color={DesignSystem.colors.text.tertiary} />
            <Text style={styles.jobInfoText}>{job.location}</Text>
          </View>
          <View style={styles.jobInfoItem}>
            <Ionicons name="time-outline" size={14} color={DesignSystem.colors.text.tertiary} />
            <Text style={styles.jobInfoText}>{job.postedAt}</Text>
          </View>
          {job.deadline && (
            <View style={styles.jobInfoItem}>
              <Ionicons name="calendar-outline" size={14} color={DesignSystem.colors.text.tertiary} />
              <Text style={styles.jobInfoText}>{job.deadline} left</Text>
            </View>
          )}
        </View>
        
        <View style={[
          styles.jobTypeBadge,
          { backgroundColor: getJobTypeColor(job.type) + '20' }
        ]}>
          <Text style={[
            styles.jobTypeText,
            { color: getJobTypeColor(job.type) }
          ]}>
            {job.type.replace('-', ' ')}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SophisticatedHeader
        title="Job Marketplace"
        subtitle={`${filteredJobs.length} opportunities available`}
      />
      
      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={DesignSystem.colors.text.tertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs, skills, companies..."
            placeholderTextColor={DesignSystem.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color={DesignSystem.colors.text.tertiary}
              />
            </Pressable>
          )}
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContainer}
        >
          {JOB_FILTERS.map((filter) => (
            <Pressable
              key={filter.id}
              style={[
                styles.filterChip,
                activeFilter === filter.id && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter.id)}
            >
              <Ionicons
                name={filter.icon}
                size={16}
                color={
                  activeFilter === filter.id
                    ? DesignSystem.colors.text.inverse
                    : DesignSystem.colors.text.secondary
                }
              />
              <Text style={[
                styles.filterText,
                activeFilter === filter.id && styles.filterTextActive,
              ]}>
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      
      {/* Job List */}
      <FlatList
        data={filteredJobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        style={styles.jobsList}
        contentContainerStyle={styles.jobsListContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.jobSeparator} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={48} color={DesignSystem.colors.text.tertiary} />
            <Text style={styles.emptyStateTitle}>No jobs found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Try adjusting your search criteria or check back later for new opportunities
            </Text>
          </View>
        )}
      />
      
      {/* Floating Action Button */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/create')}
      >
        <Ionicons name="add" size={24} color={DesignSystem.colors.text.inverse} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.surface.primary,
  },
  
  // Search Section
  searchSection: {
    paddingHorizontal: DesignSystem.layout.containerPadding,
    paddingVertical: DesignSystem.spacing.xl,
    gap: DesignSystem.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.secondary,
  },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.surface.secondary,
    borderRadius: DesignSystem.radius.xl,
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.lg,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.primary,
    gap: DesignSystem.spacing.md,
  },
  
  searchIcon: {
    marginLeft: DesignSystem.spacing.sm,
  },
  
  searchInput: {
    flex: 1,
    ...DesignSystem.typography.body.medium,
    color: DesignSystem.colors.text.primary,
  },
  
  filtersScroll: {
    flexGrow: 0,
  },
  
  filtersContainer: {
    gap: DesignSystem.spacing.md,
    paddingRight: DesignSystem.spacing.xl,
  },
  
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.radius.xl,
    backgroundColor: DesignSystem.colors.surface.secondary,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.primary,
    gap: DesignSystem.spacing.sm,
  },
  
  filterChipActive: {
    backgroundColor: DesignSystem.colors.primary[800],
    borderColor: DesignSystem.colors.primary[800],
  },
  
  filterText: {
    ...DesignSystem.typography.label.medium,
    color: DesignSystem.colors.text.secondary,
  },
  
  filterTextActive: {
    color: DesignSystem.colors.text.inverse,
  },
  
  // Jobs List
  jobsList: {
    flex: 1,
  },
  
  jobsListContent: {
    paddingHorizontal: DesignSystem.layout.containerPadding,
    paddingTop: DesignSystem.spacing['2xl'],
    paddingBottom: 160, // Space for tab bar and FAB
  },
  
  jobSeparator: {
    height: DesignSystem.spacing.xl,
  },
  
  // Job Card
  jobCard: {
    backgroundColor: DesignSystem.colors.surface.elevated,
    borderRadius: DesignSystem.radius.xl,
    padding: DesignSystem.spacing['2xl'],
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.secondary,
    ...DesignSystem.shadows.sm,
    gap: DesignSystem.spacing.lg,
    position: 'relative',
  },
  
  featuredJobCard: {
    borderColor: DesignSystem.colors.primary[800],
    ...DesignSystem.shadows.md,
  },
  
  featuredBadge: {
    position: 'absolute',
    top: DesignSystem.spacing.xl,
    right: DesignSystem.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.primary[800],
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.radius.lg,
    gap: DesignSystem.spacing.xs,
  },
  
  featuredText: {
    ...DesignSystem.typography.label.small,
    color: DesignSystem.colors.text.inverse,
  },
  
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: DesignSystem.spacing.lg,
  },
  
  jobTitleContainer: {
    flex: 1,
    gap: DesignSystem.spacing.xs,
  },
  
  jobTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
  },
  
  jobCompany: {
    ...DesignSystem.typography.body.small,
    color: DesignSystem.colors.text.secondary,
  },
  
  jobMeta: {
    alignItems: 'flex-end',
    gap: DesignSystem.spacing.sm,
  },
  
  jobSalary: {
    ...DesignSystem.typography.label.large,
    color: DesignSystem.colors.status.success,
  },
  
  difficultyBadge: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.radius.md,
  },
  
  difficultyText: {
    ...DesignSystem.typography.label.small,
    textTransform: 'capitalize',
  },
  
  jobDescription: {
    ...DesignSystem.typography.body.medium,
    color: DesignSystem.colors.text.secondary,
    lineHeight: 22,
  },
  
  jobTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.sm,
    alignItems: 'center',
  },
  
  tag: {
    backgroundColor: DesignSystem.colors.surface.tertiary,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.radius.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.tertiary,
  },
  
  tagText: {
    ...DesignSystem.typography.label.small,
    color: DesignSystem.colors.text.secondary,
  },
  
  moreTags: {
    ...DesignSystem.typography.label.small,
    color: DesignSystem.colors.text.tertiary,
  },
  
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: DesignSystem.spacing.lg,
  },
  
  jobInfo: {
    flex: 1,
    gap: DesignSystem.spacing.sm,
  },
  
  jobInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
  },
  
  jobInfoText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.tertiary,
  },
  
  jobTypeBadge: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.radius.md,
  },
  
  jobTypeText: {
    ...DesignSystem.typography.label.small,
    textTransform: 'capitalize',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing['6xl'],
    gap: DesignSystem.spacing.xl,
  },
  
  emptyStateTitle: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
  },
  
  emptyStateSubtitle: {
    ...DesignSystem.typography.body.medium,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  
  // FAB
  fab: {
    position: 'absolute',
    bottom: 160, // Above tab bar
    right: DesignSystem.layout.containerPadding,
    width: 56,
    height: 56,
    borderRadius: DesignSystem.radius.xl,
    backgroundColor: DesignSystem.colors.primary[800],
    alignItems: 'center',
    justifyContent: 'center',
    ...DesignSystem.shadows.lg,
    zIndex: 10,
  },
});
