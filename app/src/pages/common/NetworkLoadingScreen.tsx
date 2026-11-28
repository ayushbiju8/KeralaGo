/**
 * Page: NetworkLoadingScreen
 *
 * Dedicated standalone loading screen displayed during low network conditions,
 * initial offline synchronization, or pending long-running operations.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetworkLoadingOverlay from '../../components/organisms/NetworkLoadingOverlay';
import { Colors } from '../../constants/theme';

export interface NetworkLoadingScreenProps {
  /** Optional custom title */
  title?: string;
  /** Optional custom subtitle */
  subtitle?: string;
  /** Custom activity name */
  activityName?: string;
  /** Custom retry callback */
  onRetry?: () => void;
  /** Optional back/dismiss callback */
  onBack?: () => void;
}

export const NetworkLoadingScreen: React.FC<NetworkLoadingScreenProps> = ({
  title = 'Connecting to KeralaGO...',
  subtitle = 'Detecting slower network connection. We are keeping your ride requests synchronized.',
  activityName = 'Syncing dispatch server',
  onRetry,
  onBack,
}) => {
  const [retryCount, setRetryCount] = useState<number>(0);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    if (onRetry) {
      onRetry();
    } else {
      setTimeout(() => {
        Alert.alert('Connection Restored', 'Re-established link with KeralaGO servers.');
      }, 1000);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <NetworkLoadingOverlay
          title={title}
          subtitle={subtitle}
          activityName={`${activityName}${retryCount > 0 ? ` (Attempt ${retryCount + 1})` : ''}`}
          isLowNetwork={true}
          fullscreen={false}
          onRetry={handleRetry}
          onCancel={onBack}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});

export default NetworkLoadingScreen;
