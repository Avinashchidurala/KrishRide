import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, HeaderProps } from './Header';

export interface ScreenLayoutProps {
  children: React.ReactNode;
  header?: HeaderProps | null;
  scrollable?: boolean;
  backgroundColor?: string;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  header,
  scrollable = false,
  backgroundColor = '#F5F5F5',
  contentStyle,
  edges = ['top', 'bottom'],
}) => {
  const ContentWrapper = scrollable ? ScrollView : View;
  const contentProps = scrollable
    ? {
        style: [styles.scrollContent, contentStyle],
        contentContainerStyle: styles.scrollContentContainer,
        showsVerticalScrollIndicator: false,
      }
    : {
        style: [styles.content, contentStyle],
      };

  return (
    <SafeAreaView
      edges={header ? ['top','bottom', 'left', 'right'] : edges}
      style={[styles.container, { backgroundColor }]}
    >
      {header && <Header {...header} />}
      <ContentWrapper {...contentProps}>{children}</ContentWrapper>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
});

