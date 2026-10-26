import { useEffect, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MaterialIcon, type MaterialIconName } from '../components/MaterialIcon';
import { Button, Card, TextField } from '../components/ui';
import { useColors, useThemeStyles } from '../lib/theme';
import { spacing, type ThemeColors } from '../theme';

type DriverTab = 'Home' | 'Updates' | 'Profile';
type Availability = 'Available' | 'On trip' | 'Offline';
type DriverPage = 'edit-profile' | 'application' | null;
type DriverProfile = { name: string; contact: string; license: string };

const tabs: { label: DriverTab; icon: MaterialIconName }[] = [
  { label: 'Home', icon: 'home' },
  { label: 'Updates', icon: 'notifications' },
  { label: 'Profile', icon: 'person' },
];

const availabilityOptions: Availability[] = ['Available', 'On trip', 'Offline'];

const groupOptions = ['Boac Central TODA', 'Mogpog TODA', 'Gasan Jeepney Group'];

const sampleAnnouncements = [
  {
    id: 'a1',
    title: 'Roster check this week',
    body: 'Please confirm your assigned vehicle details with your terminal lead before Friday.',
    meta: 'Oct 24 · Boac Central TODA',
  },
  {
    id: 'a2',
    title: 'Terminal meeting reminder',
    body: 'A group meeting reminder for drivers assigned to Boac Town Center.',
    meta: 'Oct 22 · Boac Central TODA',
  },
];

export function DriverWorkspaceScreen({ onBack }: { onBack: () => void }) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [tab, setTab] = useState<DriverTab>('Home');
  const [page, setPage] = useState<DriverPage>(null);
  const [availability, setAvailability] = useState<Availability>('Available');
  const [tripConsentOpen, setTripConsentOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [notice, setNotice] = useState('');
  const [profile, setProfile] = useState<DriverProfile>({
    name: 'Alex Reyes',
    contact: '09XX-XXX-1427',
    license: 'DEMO-LICENSE-81',
  });
  const [profileDraft, setProfileDraft] = useState<DriverProfile>(profile);
  const [profileError, setProfileError] = useState('');
  const [applicationDraft, setApplicationDraft] = useState<DriverProfile>(profile);
  const [applicationGroup, setApplicationGroup] = useState(groupOptions[0]);
  const [applicationError, setApplicationError] = useState('');
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const wide = layoutWidth >= 900;

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tripConsentOpen) {
        setTripConsentOpen(false);
        return true;
      }
      if (page) {
        setPage(null);
        return true;
      }
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack, page, tripConsentOpen]);

  const handleBack = () => {
    if (tripConsentOpen) {
      setTripConsentOpen(false);
      return;
    }
    if (page) {
      setPage(null);
      setNotice('');
      return;
    }
    onBack();
  };

  const startTrip = () => {
    setAvailability('On trip');
    setTripConsentOpen(false);
    setConsentChecked(false);
    setNotice('');
  };

  const stopTrip = () => {
    setAvailability('Available');
    setNotice('Trip ended in this preview.');
  };

  const changeAvailability = (next: Availability) => {
    if (next === 'On trip') {
      if (availability !== 'On trip') {
        setConsentChecked(false);
        setTripConsentOpen(true);
      }
      return;
    }
    if (availability === 'On trip') {
      setNotice('End the active trip before changing status.');
      return;
    }
    setAvailability(next);
    setNotice('');
  };

  const openProfileEditor = () => {
    setProfileDraft(profile);
    setProfileError('');
    setPage('edit-profile');
  };

  const saveProfile = () => {
    if (!profileDraft.name.trim()) {
      setProfileError('Enter your name.');
      return;
    }
    if (profileDraft.contact.trim().length < 7) {
      setProfileError('Enter a valid contact number.');
      return;
    }
    if (profileDraft.license.trim().length < 4) {
      setProfileError('Enter your license number.');
      return;
    }
    setProfile({
      name: profileDraft.name.trim(),
      contact: profileDraft.contact.trim(),
      license: profileDraft.license.trim(),
    });
    setPage(null);
    setNotice('Profile updated — preview only.');
  };

  const openApplication = () => {
    setApplicationDraft(profile);
    setApplicationError('');
    setApplicationSubmitted(false);
    setPage('application');
  };

  const submitApplication = () => {
    if (!applicationDraft.name.trim()) {
      setApplicationError('Enter your name.');
      return;
    }
    if (applicationDraft.contact.trim().length < 7) {
      setApplicationError('Enter a valid contact number.');
      return;
    }
    if (applicationDraft.license.trim().length < 4) {
      setApplicationError('Enter your license number.');
      return;
    }
    setApplicationSubmitted(true);
    setApplicationError('');
  };

  const pageTitle = page === 'edit-profile'
    ? 'Edit profile'
    : page === 'application'
      ? 'Join a group'
      : 'Driver';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        onLayout={(event) => setLayoutWidth(event.nativeEvent.layout.width)}
      >
        <View style={styles.navBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={page ? 'Back' : 'Back to login'}
            onPress={handleBack}
            hitSlop={8}
            style={({ pressed }) => [styles.navBack, pressed && styles.pressed]}
          >
            <MaterialIcon name="arrowBack" size={21} color={colors.greenDark} />
          </Pressable>
          <Text style={styles.navTitle}>{pageTitle}</Text>
          <Text style={styles.navPreview}>Preview</Text>
        </View>

        {availability === 'On trip' && (
          <View style={styles.activeTripBar} accessibilityLiveRegion="polite">
            <View style={styles.activeTripCopy}>
              <Text style={styles.activeTripTitle}>Trip active</Text>
              <Text style={styles.activeTripDetail}>Demo mode · GPS is off</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="End trip and stop sharing"
              onPress={stopTrip}
              style={({ pressed }) => [styles.activeTripAction, pressed && styles.pressed]}
            >
              <Text style={styles.activeTripActionText}>Stop sharing</Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.workspace, wide && styles.workspaceWide]}>
          {wide && !page && (
            <View style={styles.sidebar}>
              {tabs.map((item) => (
                <DriverNavButton
                  key={item.label}
                  item={item}
                  selected={tab === item.label}
                  onPress={() => { setTab(item.label); setNotice(''); }}
                />
              ))}
              <Text style={styles.sidebarScope}>Your group and its notices only.</Text>
            </View>
          )}

          <ScrollView
            style={styles.content}
            contentContainerStyle={[styles.contentInner, wide && styles.contentInnerWide]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {notice ? (
              <Pressable onPress={() => setNotice('')} accessibilityRole="alert" style={styles.notice}>
                <Text style={styles.noticeText}>{notice}</Text>
              </Pressable>
            ) : null}

            {!page && tab === 'Home' && (
              <DriverHome
                profile={profile}
                availability={availability}
                onChangeAvailability={changeAvailability}
                onStartTrip={() => { setConsentChecked(false); setTripConsentOpen(true); }}
                onAnnouncements={() => { setTab('Updates'); setNotice(''); }}
              />
            )}
            {!page && tab === 'Updates' && <AnnouncementsScreen />}
            {!page && tab === 'Profile' && (
              <DriverProfileScreen
                profile={profile}
                onEdit={openProfileEditor}
                onApply={openApplication}
              />
            )}
            {page === 'edit-profile' && (
              <EditProfileScreen
                profile={profileDraft}
                error={profileError}
                onChange={setProfileDraft}
                onSave={saveProfile}
                onPhoto={() => setNotice('Photo upload will connect when the backend is ready.')}
                onCancel={() => { setPage(null); setProfileError(''); }}
              />
            )}
            {page === 'application' && (
              <GroupApplicationScreen
                profile={applicationDraft}
                group={applicationGroup}
                error={applicationError}
                submitted={applicationSubmitted}
                onChange={setApplicationDraft}
                onGroup={setApplicationGroup}
                onSubmit={submitApplication}
                onBack={() => setPage(null)}
              />
            )}

            <Text style={styles.footer}>Sample data — preview only, nothing is sent or stored.</Text>
          </ScrollView>
        </View>

        {!wide && !page && !keyboardVisible && (
          <View style={styles.bottomBar}>
            {tabs.map((item) => (
              <DriverNavButton
                key={item.label}
                item={item}
                selected={tab === item.label}
                onPress={() => { setTab(item.label); setNotice(''); }}
                compact
              />
            ))}
          </View>
        )}

        <Modal
          visible={tripConsentOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setTripConsentOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.consentSheet} accessibilityViewIsModal>
              <Text accessibilityRole="header" style={styles.consentTitle}>Share location for this trip?</Text>
              <Text style={styles.consentBody}>
                In the live app, your group sees your vehicle&apos;s location only while the trip is active. You can stop at any time.
              </Text>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: consentChecked }}
                onPress={() => setConsentChecked((value) => !value)}
                style={({ pressed }) => [styles.consentCheckRow, pressed && styles.pressed]}
              >
                <View style={[styles.checkbox, consentChecked && styles.checkboxChecked]}>
                  {consentChecked && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={styles.consentCheckText}>I consent to location sharing for this trip</Text>
              </Pressable>
              <Button label="Start trip" onPress={startTrip} disabled={!consentChecked} />
              <Button label="Cancel" variant="ghost" onPress={() => setTripConsentOpen(false)} />
              <Text style={styles.consentFootnote}>Preview — GPS is not accessed.</Text>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DriverNavButton({
  item,
  selected,
  onPress,
  compact = false,
}: {
  item: { label: DriverTab; icon: MaterialIconName };
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole={compact ? 'tab' : 'button'}
      accessibilityLabel={`${item.label}${compact ? ' tab' : ''}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        compact ? styles.bottomTab : styles.sideTab,
        selected && (compact ? styles.bottomTabSelected : styles.sideTabSelected),
        pressed && styles.pressed,
      ]}
    >
      <MaterialIcon name={item.icon} size={compact ? 22 : 20} color={selected ? colors.greenDark : colors.muted} />
      <Text style={[compact ? styles.bottomTabText : styles.sideTabText, selected && styles.navTextSelected]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

function DriverHome({
  profile,
  availability,
  onChangeAvailability,
  onStartTrip,
  onAnnouncements,
}: {
  profile: DriverProfile;
  availability: Availability;
  onChangeAvailability: (next: Availability) => void;
  onStartTrip: () => void;
  onAnnouncements: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return (
    <>
      <View style={styles.titleBlock}>
        <Text style={styles.titleEyebrow}>BOAC CENTRAL TODA</Text>
        <Text accessibilityRole="header" style={styles.largeTitle}>Hello, {profile.name.split(' ')[0]}</Text>
      </View>

      <Text style={styles.sectionLabel}>Status</Text>
      <View style={styles.segmented}>
        {availabilityOptions.map((option) => {
          const selected = availability === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={`${option} availability`}
              accessibilityState={{ selected }}
              onPress={() => onChangeAvailability(option)}
              style={[styles.segment, selected && styles.segmentSelected]}
            >
              <View style={[styles.segmentDot, option === 'On trip' && styles.segmentDotTrip, option === 'Offline' && styles.segmentDotOffline, !selected && styles.segmentDotFaded]} />
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
      {availability === 'On trip' ? (
        <Text style={styles.sectionHint}>Trip active in preview. GPS is not being used.</Text>
      ) : availability === 'Available' ? (
        <Button label="Start trip" onPress={onStartTrip} />
      ) : (
        <Text style={styles.sectionHint}>Set status to Available to start a trip.</Text>
      )}

      <Text style={styles.sectionLabel}>Assignment</Text>
      <View style={styles.group}>
        <InfoRow icon="person" label="Group" value="Boac Central TODA · Approved" first />
        <InfoRow icon="liveTrips" label="Vehicle" value="BC-014 · Tricycle" />
        <InfoRow icon="location" label="Terminal" value="Boac Town Center" />
      </View>

      <Text style={styles.sectionLabel}>Latest update</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open announcements"
        onPress={onAnnouncements}
        style={({ pressed }) => [styles.linkRow, pressed && styles.rowPressed]}
      >
        <View style={styles.rowIcon}><MaterialIcon name="notifications" size={18} color={colors.orange} /></View>
        <View style={styles.linkRowCopy}>
          <Text style={styles.rowTitle}>Roster check this week</Text>
          <Text style={styles.rowMeta}>Oct 24 · from your chairperson</Text>
        </View>
        <MaterialIcon name="chevronRight" size={20} color={colors.muted} />
      </Pressable>
    </>
  );
}

function InfoRow({
  icon,
  label,
  value,
  first = false,
}: {
  icon: MaterialIconName;
  label: string;
  value: string;
  first?: boolean;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return (
    <View style={[styles.infoRow, !first && styles.infoRowBorder]}>
      <View style={styles.rowIcon}><MaterialIcon name={icon} size={18} color={colors.green} /></View>
      <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function AnnouncementsScreen() {
  const styles = useThemeStyles(createStyles);
  return (
    <>
      <View style={styles.titleBlock}>
        <Text style={styles.titleEyebrow}>BOAC CENTRAL TODA</Text>
        <Text accessibilityRole="header" style={styles.largeTitle}>Announcements</Text>
        <Text style={styles.titleSub}>Read-only updates from your chairperson.</Text>
      </View>
      {sampleAnnouncements.map((item) => (
        <Card key={item.id} style={styles.announcementCard}>
          <Text accessibilityRole="header" style={styles.announcementTitle}>{item.title}</Text>
          <Text style={styles.announcementBody}>{item.body}</Text>
          <Text style={styles.announcementMeta}>{item.meta}</Text>
        </Card>
      ))}
    </>
  );
}

function DriverProfileScreen({
  profile,
  onEdit,
  onApply,
}: {
  profile: DriverProfile;
  onEdit: () => void;
  onApply: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  return (
    <>
      <View style={styles.titleBlock}>
        <Text accessibilityRole="header" style={styles.largeTitle}>Profile</Text>
      </View>

      <View style={styles.identityBlock}>
        <View style={styles.avatar}><Text style={styles.avatarInitials}>{initials(profile.name)}</Text></View>
        <Text style={styles.identityName}>{profile.name}</Text>
        <Text style={styles.identitySub}>Driver · Boac Central TODA</Text>
      </View>

      <Text style={styles.sectionLabel}>Details</Text>
      <View style={styles.group}>
        <InfoRow icon="phone" label="Contact" value={profile.contact} first />
        <InfoRow icon="person" label="License" value={maskLicense(profile.license)} />
        <InfoRow icon="home" label="Membership" value="Approved" />
      </View>

      <Text style={styles.sectionLabel}>Actions</Text>
      <View style={styles.group}>
        <ActionRow label="Edit profile" onPress={onEdit} first />
        <ActionRow label="Preview application" onPress={onApply} />
      </View>

      <Text style={styles.sectionHint}>License and contact details are private to you, your chairperson, and the super admin.</Text>
    </>
  );
}

function ActionRow({ label, onPress, first = false }: { label: string; onPress: () => void; first?: boolean }) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.infoRow, !first && styles.infoRowBorder, pressed && styles.rowPressed]}
    >
      <Text style={styles.actionLabel}>{label}</Text>
      <MaterialIcon name="chevronRight" size={20} color={colors.muted} />
    </Pressable>
  );
}

function EditProfileScreen({
  profile,
  error,
  onChange,
  onSave,
  onPhoto,
  onCancel,
}: {
  profile: DriverProfile;
  error: string;
  onChange: (profile: DriverProfile) => void;
  onSave: () => void;
  onPhoto: () => void;
  onCancel: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  return (
    <>
      <View style={styles.titleBlock}>
        <Text accessibilityRole="header" style={styles.largeTitle}>Edit profile</Text>
        <Text style={styles.titleSub}>Visible to your chairperson and super admin.</Text>
      </View>
      <Card style={styles.formCard}>
        <TextField label="Full name" value={profile.name} onChangeText={(name) => onChange({ ...profile, name })} placeholder="Your full name" />
        <TextField label="Contact number" value={profile.contact} onChangeText={(contact) => onChange({ ...profile, contact })} placeholder="09XX-XXX-XXXX" keyboardType="phone-pad" />
        <TextField label="Driver's license number" value={profile.license} onChangeText={(license) => onChange({ ...profile, license })} placeholder="License number" autoCapitalize="characters" />
        {error ? <Text style={styles.formError}>{error}</Text> : null}
      </Card>
      <View style={styles.group}>
        <ActionRow label="Change profile photo" onPress={onPhoto} first />
      </View>
      <Button label="Save" onPress={onSave} />
      <Button label="Cancel" variant="ghost" onPress={onCancel} />
    </>
  );
}

function GroupApplicationScreen({
  profile,
  group,
  error,
  submitted,
  onChange,
  onGroup,
  onSubmit,
  onBack,
}: {
  profile: DriverProfile;
  group: string;
  error: string;
  submitted: boolean;
  onChange: (profile: DriverProfile) => void;
  onGroup: (group: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  if (submitted) {
    return (
      <View style={styles.pendingBlock}>
        <View style={styles.pendingIcon}><Text style={styles.pendingIconText}>✓</Text></View>
        <Text accessibilityRole="header" style={styles.pendingTitle}>Request previewed</Text>
        <Text style={styles.pendingBody}>{group} · pending chairperson review.{'\n'}The approved sample membership is unchanged; nothing was sent.</Text>
        <Button label="Done" onPress={onBack} />
      </View>
    );
  }
  return (
    <>
      <View style={styles.titleBlock}>
        <Text accessibilityRole="header" style={styles.largeTitle}>Join a group</Text>
        <Text style={styles.titleSub}>Preview the application form. A chairperson approves new drivers.</Text>
      </View>

      <Text style={styles.sectionLabel}>Select a group</Text>
      <View style={styles.group}>
        {groupOptions.map((option, index) => {
          const selected = group === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onGroup(option)}
              style={({ pressed }) => [
                styles.infoRow,
                index > 0 && styles.infoRowBorder,
                pressed && styles.rowPressed,
              ]}
            >
              <Text style={styles.rowTitle}>{option}</Text>
              {selected && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Your details</Text>
      <Card style={styles.formCard}>
        <TextField label="Full name" value={profile.name} onChangeText={(name) => onChange({ ...profile, name })} placeholder="Your full name" />
        <TextField label="Contact number" value={profile.contact} onChangeText={(contact) => onChange({ ...profile, contact })} placeholder="09XX-XXX-XXXX" keyboardType="phone-pad" />
        <TextField label="Driver's license number" value={profile.license} onChangeText={(license) => onChange({ ...profile, license })} placeholder="License number" autoCapitalize="characters" />
        {error ? <Text style={styles.formError}>{error}</Text> : null}
      </Card>
      <Button label="Submit application" onPress={onSubmit} />
      <Button label="Cancel" variant="ghost" onPress={onBack} />
    </>
  );
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'DR';
}

function maskLicense(license: string) {
  if (license.length <= 4) return license;
  return `••••${license.slice(-2)}`;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.canvas },
    flex: { flex: 1 },
    pressed: { opacity: 0.75 },

    navBar: { minHeight: 56, paddingHorizontal: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navBack: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
    navTitle: { position: 'absolute', left: 0, right: 0, textAlign: 'center', color: colors.ink, fontSize: 16, fontWeight: '700' },
    navPreview: { color: colors.muted, fontSize: 12, fontWeight: '600', paddingHorizontal: 10, zIndex: 1 },

    workspace: { flex: 1 },
    workspaceWide: { flexDirection: 'row' },
    sidebar: { width: 232, padding: spacing.md, borderRightWidth: 1, borderRightColor: colors.line, gap: 4 },
    sidebarScope: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 'auto', paddingTop: 20 },
    sideTab: { minHeight: 44, paddingHorizontal: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
    sideTabSelected: { backgroundColor: colors.greenLight },
    sideTabText: { flex: 1, color: colors.muted, fontSize: 13, fontWeight: '600' },
    navTextSelected: { color: colors.greenDark },
    activeTripBar: { minHeight: 60, paddingVertical: 7, paddingHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.line, backgroundColor: colors.orangeLight, flexDirection: 'row', alignItems: 'center', gap: 12 },
    activeTripCopy: { flex: 1, gap: 2 },
    activeTripTitle: { color: colors.orangeDark, fontSize: 13, lineHeight: 17, fontWeight: '700' },
    activeTripDetail: { color: colors.muted, fontSize: 11, lineHeight: 15 },
    activeTripAction: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center' },
    activeTripActionText: { color: colors.orangeDark, fontSize: 13, fontWeight: '700' },

    content: { flex: 1 },
    contentInner: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32, gap: 12 },
    contentInnerWide: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingTop: spacing.lg },

    notice: { minHeight: 44, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.greenLight, paddingVertical: 10, paddingHorizontal: 13 },
    noticeText: { color: colors.greenDark, fontSize: 12, lineHeight: 16, fontWeight: '600' },

    titleBlock: { gap: 3, paddingTop: 6, paddingBottom: 8 },
    titleEyebrow: { color: colors.muted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
    largeTitle: { color: colors.ink, fontSize: 34, lineHeight: 42, fontWeight: '700', letterSpacing: -0.6 },
    titleSub: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 3 },

    sectionLabel: { color: colors.muted, fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 7, paddingLeft: 4 },
    sectionHint: { color: colors.muted, fontSize: 12, lineHeight: 17, paddingHorizontal: 4, marginTop: 2 },

    segmented: { minHeight: 48, flexDirection: 'row', backgroundColor: colors.fill, borderRadius: 12, padding: 2, marginBottom: 12 },
    segment: { flex: 1, minHeight: 44, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
    segmentSelected: { backgroundColor: colors.card, shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 3, elevation: 2 },
    segmentDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.onTime },
    segmentDotTrip: { backgroundColor: colors.orange },
    segmentDotOffline: { backgroundColor: colors.disabled },
    segmentDotFaded: { opacity: 0.4 },
    segmentText: { color: colors.muted, fontSize: 14, fontWeight: '500' },
    segmentTextSelected: { color: colors.ink, fontWeight: '700' },

    group: { borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, overflow: 'hidden' },
    infoRow: { minHeight: 52, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
    rowIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenLight },
    rowTitle: { color: colors.ink, fontSize: 14, fontWeight: '600' },
    rowValue: { flex: 1, textAlign: 'right', color: colors.muted, fontSize: 14, fontWeight: '500' },
    rowMeta: { color: colors.muted, fontSize: 12, lineHeight: 16, marginTop: 2 },
    rowPressed: { backgroundColor: colors.selectedCardBg },
    actionLabel: { flex: 1, color: colors.greenDark, fontSize: 14, fontWeight: '600' },
    checkmark: { flex: 1, textAlign: 'right', color: colors.greenDark, fontSize: 16, fontWeight: '800' },

    linkRow: { minHeight: 56, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
    linkRowCopy: { flex: 1 },

    announcementCard: { gap: 5, padding: 15 },
    announcementTitle: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: '700' },
    announcementBody: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    announcementMeta: { color: colors.muted, fontSize: 11, lineHeight: 15, fontWeight: '600', marginTop: 3 },

    identityBlock: { alignItems: 'center', gap: 4, paddingVertical: 8 },
    avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    avatarInitials: { color: colors.greenDark, fontSize: 24, fontWeight: '800' },
    identityName: { color: colors.ink, fontSize: 19, lineHeight: 24, fontWeight: '700' },
    identitySub: { color: colors.muted, fontSize: 13, lineHeight: 18 },

    formCard: { gap: 12, padding: 14 },
    formError: { color: colors.red, fontSize: 12, lineHeight: 16, fontWeight: '600' },

    pendingBlock: { alignItems: 'center', gap: 10, paddingTop: 40, paddingHorizontal: 8 },
    pendingIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    pendingIconText: { color: colors.greenDark, fontSize: 26, fontWeight: '900' },
    pendingTitle: { color: colors.ink, fontSize: 20, lineHeight: 25, fontWeight: '800' },
    pendingBody: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 10 },

    bottomBar: { minHeight: 72, paddingHorizontal: 8, paddingTop: 6, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, backgroundColor: colors.card, flexDirection: 'row', justifyContent: 'space-around' },
    bottomTab: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 12 },
    bottomTabSelected: { backgroundColor: 'transparent' },
    bottomTabText: { color: colors.muted, fontSize: 11, lineHeight: 14, fontWeight: '600' },

    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(12,20,15,0.45)' },
    consentSheet: { gap: 12, paddingHorizontal: spacing.lg, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 32 : spacing.lg, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.card },
    consentTitle: { color: colors.ink, fontSize: 19, lineHeight: 24, fontWeight: '700' },
    consentBody: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    consentCheckRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 2 },
    checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
    checkboxChecked: { borderColor: colors.green, backgroundColor: colors.green },
    checkboxMark: { color: '#FFFFFF', fontSize: 13, lineHeight: 16, fontWeight: '900' },
    consentCheckText: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: '600' },
    consentFootnote: { color: colors.muted, fontSize: 11, textAlign: 'center' },

    footer: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 16 },
  });
}
