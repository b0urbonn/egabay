import { useEffect, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { MaterialIcon } from '../components/MaterialIcon';
import type { AppearanceSetting } from '../lib/appearance';
import { useColors, useThemeStyles } from '../lib/theme';
import { groupOptions, tabs } from './driver/data';
import { EditProfileScreen } from './driver/EditProfilePage';
import { GroupApplicationScreen } from './driver/GroupApplicationPage';
import { DriverHome } from './driver/HomeTab';
import { DriverProfileScreen } from './driver/ProfileTab';
import { createStyles } from './driver/styles';
import { TripConsentModal } from './driver/TripConsentModal';
import type { Availability, DriverPage, DriverProfile, DriverTab } from './driver/types';
import { DriverNavButton } from './driver/ui';
import { AnnouncementsScreen } from './driver/UpdatesTab';

export function DriverWorkspaceScreen({
  appearance,
  onChangeAppearance,
  onBack,
}: {
  appearance: AppearanceSetting;
  onChangeAppearance: (setting: AppearanceSetting) => void;
  onBack: () => void;
}) {
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
                appearance={appearance}
                onChangeAppearance={onChangeAppearance}
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

            <Text style={styles.footer}>Sample data and preview actions only. Appearance preference is saved on this device.</Text>
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

        <TripConsentModal
          visible={tripConsentOpen}
          checked={consentChecked}
          onToggleCheck={() => setConsentChecked((value) => !value)}
          onStart={startTrip}
          onCancel={() => setTripConsentOpen(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
