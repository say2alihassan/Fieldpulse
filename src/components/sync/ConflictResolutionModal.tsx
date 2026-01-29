import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { format } from 'date-fns';
import { UI } from '../../constants';
import type { SyncConflict } from '../../types';

interface ConflictResolutionModalProps {
  visible: boolean;
  conflict: SyncConflict | null;
  onResolve: (conflictId: number, resolution: 'local' | 'server') => void;
  onCancel: () => void;
}

export default function ConflictResolutionModal({
  visible,
  conflict,
  onResolve,
  onCancel,
}: ConflictResolutionModalProps): React.JSX.Element | null {
  const [selectedResolution, setSelectedResolution] = useState<'local' | 'server' | null>(null);

  if (!conflict) return null;

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getEntityTypeLabel = (type: string): string => {
    switch (type) {
      case 'job':
        return 'Job';
      case 'checklist_response':
        return 'Checklist Response';
      case 'photo':
        return 'Photo';
      case 'signature':
        return 'Signature';
      default:
        return type;
    }
  };

  const localData = conflict.localData as Record<string, unknown>;
  const serverData = conflict.serverData as Record<string, unknown>;

  // Find fields that are different
  const allKeys = new Set([
    ...Object.keys(localData || {}),
    ...Object.keys(serverData || {}),
  ]);
  const differentKeys = Array.from(allKeys).filter((key) => {
    const localVal = JSON.stringify(localData?.[key]);
    const serverVal = JSON.stringify(serverData?.[key]);
    return localVal !== serverVal;
  });

  const handleConfirm = (): void => {
    if (selectedResolution) {
      onResolve(conflict.id, selectedResolution);
      setSelectedResolution(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Sync Conflict</Text>
            <Text style={styles.subtitle}>
              {getEntityTypeLabel(conflict.entityType)} has been modified both locally
              and on the server
            </Text>
          </View>

          {/* Conflict details */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Changed Fields</Text>

            {differentKeys.map((key) => (
              <View key={key} style={styles.fieldComparison}>
                <Text style={styles.fieldName}>{key}</Text>

                <View style={styles.valuesRow}>
                  {/* Local value */}
                  <TouchableOpacity
                    style={[
                      styles.valueCard,
                      selectedResolution === 'local' && styles.valueCardSelected,
                    ]}
                    onPress={() => setSelectedResolution('local')}
                  >
                    <Text style={styles.valueLabel}>Your Changes</Text>
                    <Text style={styles.valueText} numberOfLines={3}>
                      {formatValue(localData?.[key])}
                    </Text>
                  </TouchableOpacity>

                  {/* Server value */}
                  <TouchableOpacity
                    style={[
                      styles.valueCard,
                      selectedResolution === 'server' && styles.valueCardSelected,
                    ]}
                    onPress={() => setSelectedResolution('server')}
                  >
                    <Text style={styles.valueLabel}>Server Version</Text>
                    <Text style={styles.valueText} numberOfLines={3}>
                      {formatValue(serverData?.[key])}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Timestamp info */}
            <View style={styles.timestampInfo}>
              <Text style={styles.timestampText}>
                Conflict detected:{' '}
                {format(new Date(conflict.createdAt), 'MMM d, yyyy h:mm a')}
              </Text>
            </View>
          </ScrollView>

          {/* Resolution options */}
          <View style={styles.resolutionSection}>
            <Text style={styles.resolutionTitle}>Choose Version to Keep</Text>

            <View style={styles.resolutionButtons}>
              <TouchableOpacity
                style={[
                  styles.resolutionButton,
                  selectedResolution === 'local' && styles.resolutionButtonSelected,
                ]}
                onPress={() => setSelectedResolution('local')}
              >
                <Text
                  style={[
                    styles.resolutionButtonText,
                    selectedResolution === 'local' &&
                      styles.resolutionButtonTextSelected,
                  ]}
                >
                  Keep My Changes
                </Text>
                <Text style={styles.resolutionHint}>
                  Overwrite server with your local changes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.resolutionButton,
                  selectedResolution === 'server' && styles.resolutionButtonSelected,
                ]}
                onPress={() => setSelectedResolution('server')}
              >
                <Text
                  style={[
                    styles.resolutionButtonText,
                    selectedResolution === 'server' &&
                      styles.resolutionButtonTextSelected,
                  ]}
                >
                  Use Server Version
                </Text>
                <Text style={styles.resolutionHint}>
                  Discard local changes and use server data
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Decide Later</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                !selectedResolution && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedResolution}
            >
              <Text
                style={[
                  styles.confirmButtonText,
                  !selectedResolution && styles.confirmButtonTextDisabled,
                ]}
              >
                Resolve Conflict
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: UI.COLORS.surface,
    borderTopLeftRadius: UI.BORDER_RADIUS.xl,
    borderTopRightRadius: UI.BORDER_RADIUS.xl,
    maxHeight: '90%',
  },
  header: {
    padding: UI.SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: UI.COLORS.border,
  },
  title: {
    fontSize: UI.FONT_SIZE.xl,
    fontWeight: '700',
    color: UI.COLORS.text,
    marginBottom: UI.SPACING.xs,
  },
  subtitle: {
    fontSize: UI.FONT_SIZE.sm,
    color: UI.COLORS.textSecondary,
  },
  content: {
    padding: UI.SPACING.lg,
    maxHeight: 300,
  },
  sectionTitle: {
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
    color: UI.COLORS.text,
    marginBottom: UI.SPACING.md,
  },
  fieldComparison: {
    marginBottom: UI.SPACING.lg,
  },
  fieldName: {
    fontSize: UI.FONT_SIZE.sm,
    fontWeight: '600',
    color: UI.COLORS.textSecondary,
    marginBottom: UI.SPACING.sm,
    textTransform: 'capitalize',
  },
  valuesRow: {
    flexDirection: 'row',
    gap: UI.SPACING.sm,
  },
  valueCard: {
    flex: 1,
    backgroundColor: UI.COLORS.background,
    borderRadius: UI.BORDER_RADIUS.md,
    padding: UI.SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  valueCardSelected: {
    borderColor: UI.COLORS.primary,
    backgroundColor: '#E3F2FD',
  },
  valueLabel: {
    fontSize: UI.FONT_SIZE.xs,
    fontWeight: '600',
    color: UI.COLORS.textSecondary,
    marginBottom: UI.SPACING.xs,
  },
  valueText: {
    fontSize: UI.FONT_SIZE.sm,
    color: UI.COLORS.text,
  },
  timestampInfo: {
    marginTop: UI.SPACING.md,
    paddingTop: UI.SPACING.md,
    borderTopWidth: 1,
    borderTopColor: UI.COLORS.border,
  },
  timestampText: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.textSecondary,
  },
  resolutionSection: {
    padding: UI.SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: UI.COLORS.border,
  },
  resolutionTitle: {
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
    color: UI.COLORS.text,
    marginBottom: UI.SPACING.md,
  },
  resolutionButtons: {
    gap: UI.SPACING.sm,
  },
  resolutionButton: {
    padding: UI.SPACING.md,
    borderRadius: UI.BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: UI.COLORS.border,
    backgroundColor: UI.COLORS.surface,
  },
  resolutionButtonSelected: {
    borderColor: UI.COLORS.primary,
    backgroundColor: '#E3F2FD',
  },
  resolutionButtonText: {
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
    color: UI.COLORS.text,
    marginBottom: UI.SPACING.xs,
  },
  resolutionButtonTextSelected: {
    color: UI.COLORS.primary,
  },
  resolutionHint: {
    fontSize: UI.FONT_SIZE.xs,
    color: UI.COLORS.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    padding: UI.SPACING.lg,
    gap: UI.SPACING.md,
    borderTopWidth: 1,
    borderTopColor: UI.COLORS.border,
  },
  cancelButton: {
    flex: 1,
    padding: UI.SPACING.md,
    borderRadius: UI.BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: UI.COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
    color: UI.COLORS.textSecondary,
  },
  confirmButton: {
    flex: 1,
    padding: UI.SPACING.md,
    borderRadius: UI.BORDER_RADIUS.md,
    backgroundColor: UI.COLORS.primary,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: UI.COLORS.disabled,
  },
  confirmButtonText: {
    fontSize: UI.FONT_SIZE.md,
    fontWeight: '600',
    color: UI.COLORS.textLight,
  },
  confirmButtonTextDisabled: {
    color: UI.COLORS.textSecondary,
  },
});
