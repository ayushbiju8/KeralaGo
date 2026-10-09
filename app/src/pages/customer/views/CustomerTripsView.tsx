import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { ListScreenTemplate, ModalTemplate } from '../../../components/templates';
import { NavigationHeader } from '../../../components/organisms';
import { SegmentTabs } from '../../../components/molecules';
import {
  Typography,
  Badge,
  Button,
  Icon,
  Divider,
} from '../../../components/atoms';
import { Colors, Spacing, Radii, Shadows } from '../../../constants/theme';
import { customerData } from '../../../data';

export interface TripItem {
  id: string;
  timeAgo: string;
  pickup: string;
  dropoff: string;
  fare: string;
  status: 'completed' | 'cancelled';
  vehicleType: string;
  driverName: string;
  distance: string;
  duration: string;
  driverRating?: number;
  carPlate?: string;
  paymentMethod?: string;
}

const TAB_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const REPORT_REASONS = [
  'Rash or Reckless Driving',
  'Demanded Extra Cash / Meter Dispute',
  'Unprofessional / Rude Behavior',
  'AC Refusal / Vehicle Condition',
  'Wrong Route / Unsafe Dropoff',
  'Other Safety Concern',
];

const CustomerTripsView: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedTripForReceipt, setSelectedTripForReceipt] = useState<TripItem | null>(null);

  // Reporting driver state
  const [reportingTrip, setReportingTrip] = useState<TripItem | null>(null);
  const [reportReason, setReportReason] = useState<string>(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState<string>('');

  // Enriched trip data for modal detail popup
  const enrichedTrips: TripItem[] = useMemo(() => {
    return customerData.tripsHistory.map((trip, idx) => {
      const plates = ['KL-07-CD-4512', 'KL-44-A-1204', 'KL-01-BK-8890', 'KL-07-AL-6031'];
      const ratings = [4.9, 4.8, 5.0, 4.7];
      const payments = ['UPI (GPay)', 'Cash on Trip', 'KeralaGO Wallet', 'UPI (PhonePe)'];

      return {
        ...trip,
        status: trip.status as 'completed' | 'cancelled',
        carPlate: plates[idx % plates.length],
        driverRating: ratings[idx % ratings.length],
        paymentMethod: payments[idx % payments.length],
      };
    });
  }, []);

  const filteredTrips = useMemo(() => {
    if (selectedFilter === 'all') return enrichedTrips;
    return enrichedTrips.filter((trip) => trip.status === selectedFilter);
  }, [enrichedTrips, selectedFilter]);

  const handleDownloadInvoice = (tripId: string) => {
    Alert.alert(
      'Receipt Downloaded',
      `Official GST Invoice for Booking ${tripId} has been saved to your downloads.`
    );
  };

  const handleSubmitReport = () => {
    if (!reportingTrip) return;
    const driver = reportingTrip.driverName;
    const tripId = reportingTrip.id;
    setReportingTrip(null);
    setReportDetails('');
    Alert.alert(
      'Report Submitted',
      `Your report regarding driver ${driver} (Booking ${tripId}) has been logged under reason: "${reportReason}". Our safety team will review and contact you within 24 hours.`
    );
  };

  return (
    <ListScreenTemplate
      header={
        <NavigationHeader
          title="My Bookings"
          showBack={false}
        />
      }
      filters={
        <View style={styles.filterSection}>
          <SegmentTabs
            options={TAB_OPTIONS}
            selectedId={selectedFilter}
            onSelect={setSelectedFilter}
          />
        </View>
      }
    >
      <View style={styles.listContainer}>
        {filteredTrips.map((trip) => {
          const isCompleted = trip.status === 'completed';

          return (
            <TouchableOpacity
              key={trip.id}
              style={styles.tripCard}
              activeOpacity={0.75}
              onPress={() => setSelectedTripForReceipt(trip)}
            >
              {/* 1. Top Row: Time of Booking & Status */}
              <View style={styles.cardTopRow}>
                <View style={styles.timeWrap}>
                  <Icon library="Ionicons" name="time-outline" size={14} color="#64748B" />
                  <Typography variant="caption" weight="medium" color="#64748B" style={{ marginLeft: 5 }}>
                    {trip.timeAgo}
                  </Typography>
                </View>

                <Badge
                  variant={isCompleted ? 'success' : 'danger'}
                  label={isCompleted ? 'Completed' : 'Cancelled'}
                  size="sm"
                  dot={true}
                />
              </View>

              {/* 2. Route Section (Essential Pickup & Dropoff) */}
              <View style={styles.routeContainer}>
                <View style={styles.routeDotsCol}>
                  <View style={styles.pickupDot} />
                  <View style={styles.connectorLine} />
                  <View style={styles.dropoffDot} />
                </View>

                <View style={styles.routeTextCol}>
                  <Typography variant="body2" weight="semiBold" color="#0F172A" numberOfLines={1}>
                    {trip.pickup}
                  </Typography>
                  <Typography
                    variant="body2"
                    weight="semiBold"
                    color="#0F172A"
                    numberOfLines={1}
                    style={{ marginTop: 10 }}
                  >
                    {trip.dropoff}
                  </Typography>
                </View>
              </View>

              <Divider style={styles.cardDivider} />

              {/* 3. Bottom Row: Driver Name & Cost */}
              <View style={styles.cardBottomRow}>
                <View style={styles.driverWrap}>
                  <View style={styles.driverIconCircle}>
                    <Icon library="Ionicons" name="person" size={12} color="#0F4A2B" />
                  </View>
                  <Typography variant="body2" weight="medium" color="#334155" style={{ marginLeft: 8 }}>
                    {trip.driverName}
                  </Typography>
                </View>

                <View style={styles.costWrap}>
                  <Typography
                    variant="h3"
                    weight="bold"
                    color={isCompleted ? '#0F4A2B' : '#64748B'}
                  >
                    {trip.fare}
                  </Typography>
                  <Icon library="Ionicons" name="chevron-forward" size={14} color="#94A3B8" style={{ marginLeft: 4 }} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredTrips.length === 0 && (
          <View style={styles.emptyState}>
            <Icon library="Ionicons" name="receipt-outline" size={38} color="#94A3B8" />
            <Typography variant="body1" color="#64748B" weight="medium" align="center" style={{ marginTop: 10 }}>
              No {selectedFilter !== 'all' ? selectedFilter : ''} bookings found.
            </Typography>
          </View>
        )}
      </View>

      {/* ── Detailed Receipt Modal (Appears When Card is Clicked) ── */}
      <ModalTemplate
        visible={!!selectedTripForReceipt}
        onClose={() => setSelectedTripForReceipt(null)}
        style={styles.modalCard}
      >
        {selectedTripForReceipt && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
            {/* Modal Header with UUID */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Typography variant="h3" weight="bold" color="#0F172A">
                  Trip Receipt
                </Typography>
                <Typography variant="xs" color="#64748B" weight="semiBold" style={{ marginTop: 2 }}>
                  Booking ID: {selectedTripForReceipt.id}
                </Typography>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedTripForReceipt(null)}
              >
                <Icon library="Ionicons" name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* Status & Timing Banner */}
            <View
              style={[
                styles.modalStatusBanner,
                selectedTripForReceipt.status === 'cancelled' && {
                  backgroundColor: '#FEE2E2',
                  borderColor: '#FCA5A5',
                },
              ]}
            >
              <Icon
                library="Ionicons"
                name={selectedTripForReceipt.status === 'completed' ? 'checkmark-circle' : 'close-circle'}
                size={22}
                color={selectedTripForReceipt.status === 'completed' ? '#16A34A' : '#DC2626'}
              />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Typography
                  variant="body2"
                  weight="bold"
                  color={selectedTripForReceipt.status === 'completed' ? '#14532D' : '#991B1B'}
                >
                  {selectedTripForReceipt.status === 'completed' ? 'Ride Completed' : 'Trip Cancelled'}
                </Typography>
                <Typography
                  variant="caption"
                  color={selectedTripForReceipt.status === 'completed' ? '#166534' : '#B91C1C'}
                >
                  {selectedTripForReceipt.timeAgo}
                </Typography>
              </View>
            </View>

            {/* Vehicle & Driver Details */}
            <View style={styles.modalDetailBox}>
              <View style={styles.detailRow}>
                <Typography variant="body2" color="#64748B">Driver</Typography>
                <Typography variant="body2" weight="semiBold" color="#0F172A">
                  {selectedTripForReceipt.driverName} ({selectedTripForReceipt.driverRating} ★)
                </Typography>
              </View>

              <View style={styles.detailRow}>
                <Typography variant="body2" color="#64748B">Vehicle</Typography>
                <Typography variant="body2" weight="semiBold" color="#0F172A">
                  {selectedTripForReceipt.vehicleType}
                </Typography>
              </View>

              <View style={styles.detailRow}>
                <Typography variant="body2" color="#64748B">Car Plate</Typography>
                <Typography variant="body2" weight="semiBold" color="#0F172A">
                  {selectedTripForReceipt.carPlate}
                </Typography>
              </View>

              <View style={styles.detailRow}>
                <Typography variant="body2" color="#64748B">Distance & Time</Typography>
                <Typography variant="body2" weight="semiBold" color="#0F172A">
                  {selectedTripForReceipt.distance} • {selectedTripForReceipt.duration}
                </Typography>
              </View>
            </View>

            {/* Full Route */}
            <View style={styles.modalRouteBox}>
              <View style={styles.modalRoutePoint}>
                <View style={[styles.modalDot, { backgroundColor: '#16A34A' }]} />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Typography variant="caption" weight="bold" color="#166534">
                    PICKUP
                  </Typography>
                  <Typography variant="body2" weight="medium" color="#0F172A">
                    {selectedTripForReceipt.pickup}
                  </Typography>
                </View>
              </View>

              <View style={styles.modalRouteLine} />

              <View style={styles.modalRoutePoint}>
                <View style={[styles.modalDot, { backgroundColor: '#DC2626' }]} />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Typography variant="caption" weight="bold" color="#991B1B">
                    DROPOFF
                  </Typography>
                  <Typography variant="body2" weight="medium" color="#0F172A">
                    {selectedTripForReceipt.dropoff}
                  </Typography>
                </View>
              </View>
            </View>

            {/* Cost Breakdown */}
            <View style={styles.modalFareBox}>
              <View style={styles.detailRow}>
                <Typography variant="body2" color="#64748B">Base & Distance Fare</Typography>
                <Typography variant="body2" weight="medium" color="#0F172A">
                  {selectedTripForReceipt.fare}
                </Typography>
              </View>

              <View style={styles.detailRow}>
                <Typography variant="body2" color="#16A34A">Kerala Eco Discount</Typography>
                <Typography variant="body2" weight="semiBold" color="#16A34A">
                  -₹10.00
                </Typography>
              </View>

              <Divider style={{ marginVertical: 8 }} />

              <View style={styles.detailRow}>
                <Typography variant="body1" weight="bold" color="#0F172A">Total Paid</Typography>
                <Typography variant="h3" weight="bold" color="#0F4A2B">
                  {selectedTripForReceipt.fare}
                </Typography>
              </View>

              <Typography variant="xs" color="#64748B" style={{ marginTop: 4 }}>
                Payment Mode: {selectedTripForReceipt.paymentMethod}
              </Typography>
            </View>

            {/* Actions: Download Invoice & Report Driver */}
            <View style={styles.modalActionButtons}>
              <Button
                variant="primary"
                size="md"
                label="Download Receipt"
                leftIcon={<Icon library="Ionicons" name="download-outline" size={17} color="#FFFFFF" />}
                onPress={() => handleDownloadInvoice(selectedTripForReceipt.id)}
                fullWidth
              />

              <Button
                variant="outline"
                size="md"
                label="Report Driver / Safety Issue"
                leftIcon={<Icon library="Ionicons" name="warning-outline" size={16} color="#DC2626" />}
                onPress={() => {
                  const trip = selectedTripForReceipt;
                  setSelectedTripForReceipt(null);
                  setReportingTrip(trip);
                }}
                fullWidth
                style={{ borderColor: '#FCA5A5' }}
                labelStyle={{ color: '#DC2626' }}
              />
            </View>
          </ScrollView>
        )}
      </ModalTemplate>

      {/* ── Report Driver Modal ── */}
      <ModalTemplate
        visible={!!reportingTrip}
        onClose={() => setReportingTrip(null)}
        style={styles.modalCard}
      >
        {reportingTrip && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Typography variant="h3" weight="bold" color="#DC2626">
                  Report Driver
                </Typography>
                <Typography variant="xs" color="#64748B" weight="semiBold" style={{ marginTop: 2 }}>
                  Driver: {reportingTrip.driverName} • {reportingTrip.vehicleType}
                </Typography>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setReportingTrip(null)}
              >
                <Icon library="Ionicons" name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <Typography variant="body2" weight="semiBold" color="#0F172A" style={{ marginBottom: 10 }}>
              Select Reason:
            </Typography>

            {/* Reasons List */}
            <View style={styles.reasonsList}>
              {REPORT_REASONS.map((reason) => {
                const isSelected = reportReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.reasonOption, isSelected && styles.reasonOptionSelected]}
                    onPress={() => setReportReason(reason)}
                    activeOpacity={0.8}
                  >
                    <Icon
                      library="Ionicons"
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={17}
                      color={isSelected ? '#DC2626' : '#94A3B8'}
                    />
                    <Typography
                      variant="body2"
                      weight={isSelected ? 'semiBold' : 'regular'}
                      color={isSelected ? '#991B1B' : '#334155'}
                      style={{ marginLeft: 8, flex: 1 }}
                    >
                      {reason}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Additional details */}
            <Typography variant="caption" weight="bold" color="#475569" style={{ marginTop: 14, marginBottom: 6 }}>
              ADDITIONAL DETAILS (OPTIONAL)
            </Typography>
            <TextInput
              style={styles.reportTextInput}
              value={reportDetails}
              onChangeText={setReportDetails}
              placeholder="Describe what happened so our safety team can investigate..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              underlineColorAndroid="transparent"
              cursorColor="#DC2626"
            />

            {/* Submit & Cancel Buttons */}
            <Button
              variant="danger"
              size="md"
              label="Submit Safety Report"
              leftIcon={<Icon library="Ionicons" name="shield-checkmark" size={17} color="#FFFFFF" />}
              onPress={handleSubmitReport}
              fullWidth
              style={{ marginTop: 14 }}
            />

            <Button
              variant="ghost"
              size="sm"
              label="Cancel"
              onPress={() => setReportingTrip(null)}
              fullWidth
              style={{ marginTop: 6 }}
            />
          </ScrollView>
        )}
      </ModalTemplate>
    </ListScreenTemplate>
  );
};

const styles = StyleSheet.create({
  filterSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  listContainer: {
    paddingVertical: Spacing.sm,
    paddingBottom: Spacing['3xl'],
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
      },
    }),
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  routeDotsCol: {
    width: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  connectorLine: {
    width: 1.5,
    height: 18,
    backgroundColor: '#CBD5E1',
    marginVertical: 2,
  },
  dropoffDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#DC2626',
  },
  routeTextCol: {
    flex: 1,
  },
  cardDivider: {
    marginVertical: 12,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driverWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  costWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    maxHeight: '85%',
    width: '92%',
    maxWidth: 440,
    padding: 0,
    overflow: 'hidden',
  },
  modalScrollContent: {
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  modalDetailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalRouteBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  modalRoutePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  modalRouteLine: {
    width: 1.5,
    height: 12,
    backgroundColor: '#CBD5E1',
    marginLeft: 3.5,
    marginVertical: 3,
  },
  modalFareBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  modalActionButtons: {
    gap: 8,
    marginTop: 6,
  },
  reasonsList: {
    gap: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reasonOptionSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  reportTextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  } as any,
});

export default CustomerTripsView;
