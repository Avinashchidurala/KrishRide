import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking,
  Platform, TextInput} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenLayout } from '../../components/layout';

interface FAQ {
  question: string;
  answer: string;
}

export default function SupportScreen() {
  const navigation = useNavigation();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs: FAQ[] = [
    {
      question: 'Can I drive rented Cars?',
      answer: 'Only if you are legally permitted and documents are valid.',
    },
    {
      question: 'Will I Earn money from rides?',
      answer: 'Drivers receive a fuel cost contribution, not profit. HushRyd promotes responsible cost-sharing.',
    },
    {
      question: 'How do I add money to my wallet?',
      answer: 'Navigate to "Wallet" section, click on "Add Money" and follow the payment instructions.',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept payments through Razorpay (UPI, cards, netbanking). You can also add money to your wallet for faster bookings.',
    },
    {
      question: 'Can I reject ride requests?',
      answer: 'Yes, but frequent rejections may affect your rating and visibility.',
    },
    {
      question: 'What should I do in case of an emergency?',
      answer: 'Use the SOS feature available in your booking details or dashboard to alert emergency services and our support team.',
    },
  ];

  const filteredFAQs = searchQuery.trim()
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@hushryd.com');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+917780445190');
  };

  const toggleFAQ = (question: string) => {
    setExpandedFAQ(expandedFAQ === question ? null : question);
  };

  return (
    <ScreenLayout
      header={{
        title: 'Support & Help',
        showBack: true,
      }}
      scrollable
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Support Card */}
        <View style={styles.contactCard}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          
          <TouchableOpacity 
            style={styles.contactRow}
            onPress={handleEmailPress}
            activeOpacity={0.7}
          >
            <View style={styles.contactIconContainer}>
              <MaterialIcons name="email" size={22} color="#FF6B35" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactSubtitle}>support@hushryd.com</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#ADB5BD" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.contactRow}
            onPress={handlePhonePress}
            activeOpacity={0.7}
          >
            <View style={styles.contactIconContainer}>
              <MaterialIcons name="phone" size={22} color="#FF6B35" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Call Support</Text>
              <Text style={styles.contactSubtitle}>+91 7780445190</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#ADB5BD" />
          </TouchableOpacity>
        </View>

        {/* Emergency Note */}
        <View style={styles.emergencyNote}>
          <MaterialIcons name="warning" size={18} color="#FF9800" />
          <Text style={styles.emergencyText}>
            For urgent issues, use <Text style={styles.sosLink} onPress={() => navigation.navigate('SOS' as never)}>SOS</Text>
          </Text>
        </View>

        {/* FAQs Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {/* Search FAQs */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search FAQs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="clear" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* New Ticket Button */}
          <TouchableOpacity
            style={styles.ticketButton}
            onPress={() => navigation.navigate('DriverSupportTickets' as never)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="support-agent" size={24} color="#FFF" />
            <Text style={styles.ticketButtonText}>My Support Tickets</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
          
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => (
              <TouchableOpacity
                key={index}
                style={styles.faqCard}
                onPress={() => toggleFAQ(faq.question)}
                activeOpacity={0.7}
              >
                <View style={styles.faqQuestionRow}>
                  <Text style={styles.faqQuestionText} numberOfLines={expandedFAQ === faq.question ? undefined : 2}>
                    {faq.question}
                  </Text>
                  <MaterialIcons
                    name={expandedFAQ === faq.question ? 'expand-less' : 'expand-more'}
                    size={24}
                    color="#FF6B35"
                  />
                </View>
                {expandedFAQ === faq.question && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noResults}>
              <MaterialIcons name="search-off" size={48} color="#E0E0E0" />
              <Text style={styles.noResultsText}>No FAQs found</Text>
              <Text style={styles.noResultsSubtext}>Try a different search term</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  // Contact Support Card
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    height: 48,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  // Emergency Note
  emergencyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  emergencyText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  sosLink: {
    color: '#FF6B35',
    fontWeight: '700',
  },
  // FAQs Section
  faqSection: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  ticketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  ticketButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 12,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#666',
  },
});
