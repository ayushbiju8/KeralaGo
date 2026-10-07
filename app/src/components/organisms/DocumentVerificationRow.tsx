/**
 * Organism: DocumentVerificationRow
 *
 * Displays a document/verification item with name and verified/pending status.
 *
 * Used in:
 *  - Driver Profile — Documents section (RC Book, Driving License, Insurance, Police Verification)
 *  - Admin Driver Profile — Verification & Documents section
 *
 * Reference: Driver Profile, Admin Driver Profile screens
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Icon, { IconLibrary } from '../atoms/Icon';
import Typography from '../atoms/Typography';
import Badge from '../atoms/Badge';
import Divider from '../atoms/Divider';
import { Colors, Spacing, Radii } from '../../constants/theme';

export type VerificationStatus = 'verified' | 'pending' | 'rejected';

export interface DocumentVerificationRowProps {
  /** Document name */
  label: string;
  /** Icon */
  iconName?: string;
  /** Icon library */
  iconLibrary?: IconLibrary;
  /** Verification status */
  status?: VerificationStatus;
  /** Show bottom divider */
  showDivider?: boolean;
  /** Override style */
  style?: ViewStyle;
}

const statusConfig: Record<VerificationStatus, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
  verified: { variant: 'success', label: 'Verified' },
  pending:  { variant: 'warning', label: 'Pending'  },
  rejected: { variant: 'danger',  label: 'Rejected' },
};

const DocumentVerificationRow: React.FC<DocumentVerificationRowProps> = ({
  label,
  iconName = 'document-text-outline',
  iconLibrary = 'Ionicons',
  status = 'pending',
  showDivider = true,
  style,
}) => {
  const config = statusConfig[status];

  return (
    <>
      <View style={[styles.row, style]}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <Icon
            library={iconLibrary}
            name={iconName}
            size="md"
            color={status === 'verified' ? Colors.success : Colors.textSecondary}
          />
        </View>

        {/* Label */}
        <Typography variant="body2" color={Colors.textPrimary} style={styles.label}>
          {label}
        </Typography>

        {/* Status badge */}
        <Badge variant={config.variant} label={config.label} size="sm" />
      </View>

      {showDivider && <Divider style={styles.divider} />}
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  label: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  divider: {
    marginLeft: 36 + Spacing.md,
  },
});

export default DocumentVerificationRow;
