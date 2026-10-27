import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { ComponentRef } from 'react';

import { MaterialIcon } from '../components/MaterialIcon';
import { ScreenTransition } from '../components/ScreenTransition';
import { useColors, useThemeStyles } from '../lib/theme';
import { AssignmentsTab } from './chairperson/AssignmentsTab';
import { DriversTab } from './chairperson/DriversTab';
import { OverviewTab } from './chairperson/OverviewTab';
import { TerminalForm } from './chairperson/TerminalForm';
import { TerminalsTab } from './chairperson/TerminalsTab';
import { UpdatesTab } from './chairperson/UpdatesTab';
import { VehicleForm } from './chairperson/VehicleForm';
import { VehiclesTab } from './chairperson/VehiclesTab';
import {
  consoleTabs,
  initialAnnouncements,
  initialDrivers,
  initialTerminals,
  initialVehicles,
  tabIcons,
} from './chairperson/data';
import { createStyles } from './chairperson/styles';
import type {
  AnnouncementRecord,
  ConsoleTab,
  DriverFilter,
  DriverRecord,
  TerminalFormState,
  TerminalRecord,
  VehicleFormState,
  VehicleRecord,
} from './chairperson/types';

export function ChairpersonConsoleScreen({ onBack }: { onBack: () => void }) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const wide = layoutWidth >= 900;
  const [formError, setFormError] = useState('');
  const [tab, setTab] = useState<ConsoleTab>('Overview');
  const [terminals, setTerminals] = useState<TerminalRecord[]>(initialTerminals);
  const [drivers, setDrivers] = useState<DriverRecord[]>(initialDrivers);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>(initialVehicles);
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>(initialAnnouncements);
  const [notice, setNotice] = useState('');
  const [driverFilter, setDriverFilter] = useState<DriverFilter>('Applications');
  const [terminalForm, setTerminalForm] = useState<TerminalFormState | null>(null);
  const [vehicleForm, setVehicleForm] = useState<VehicleFormState | null>(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [assigningVehicleId, setAssigningVehicleId] = useState<string | null>(null);
  const [expandedTerminalId, setExpandedTerminalId] = useState<string | null>(null);
  const [vehicleTerminalFilter, setVehicleTerminalFilter] = useState<string | null>(null);

  const pendingCount = drivers.filter((driver) => driver.status === 'Pending').length;
  const activeDriverCount = drivers.filter((driver) => driver.status === 'Approved').length;
  const assignedCount = vehicles.filter((vehicle) => vehicle.driverId !== null).length;
  const terminalRows = terminals.map((terminal) => ({ ...terminal, vehicles: vehicles.filter((vehicle) => vehicle.terminalId === terminal.id).length }));
  const terminalName = (id: string) => terminals.find((terminal) => terminal.id === id)?.name ?? 'Unassigned terminal';
  const driverName = (id: string | null) => drivers.find((driver) => driver.id === id)?.name ?? 'No driver assigned';
  const availableDrivers = useMemo(
    () => drivers.filter((driver) => driver.status === 'Approved' && !vehicles.some((vehicle) => vehicle.driverId === driver.id)),
    [drivers, vehicles],
  );

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setFormError('');
  }, [tab, Boolean(terminalForm), Boolean(vehicleForm)]);

  const handleBack = () => {
    if (terminalForm) { setTerminalForm(null); return; }
    if (vehicleForm) { setVehicleForm(null); return; }
    if (tab === 'Assignments') { setTab('Vehicles'); return; }
    onBack();
  };

  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (terminalForm) setTerminalForm(null);
      else if (vehicleForm) setVehicleForm(null);
      else if (tab === 'Assignments') setTab('Vehicles');
      else onBack();
      return true;
    });
    return () => listener.remove();
  }, [tab, Boolean(terminalForm), Boolean(vehicleForm), onBack]);

  const showNotice = (message: string) => setNotice(message);

  const updateApplication = (driverId: string, status: 'Approved' | 'Rejected') => {
    setDrivers((current) => current.map((driver) => driver.id === driverId ? { ...driver, status, decisionAt: new Date().toLocaleString() } : driver));
    const name = drivers.find((driver) => driver.id === driverId)?.name ?? 'Driver';
    showNotice(`${name}'s application marked ${status.toLowerCase()} in this preview.`);
  };

  const saveTerminal = () => {
    if (!terminalForm) return;
    const coordinates = terminalForm.pin.split(',').map((part) => part.trim());
    if (!terminalForm.name.trim() || !terminalForm.municipality.trim() || !terminalForm.barangay.trim()) {
      setFormError('Enter the terminal name, municipality, and barangay.');
      return;
    }
    if (coordinates.length !== 2 || coordinates.some((part) => !part || !Number.isFinite(Number(part))) || Math.abs(Number(coordinates[0])) > 90 || Math.abs(Number(coordinates[1])) > 180) {
      setFormError('Enter a valid latitude (−90 to 90) and longitude (−180 to 180).');
      return;
    }
    if (terminals.some((terminal) => terminal.id !== terminalForm.id && terminal.name.toLowerCase() === terminalForm.name.trim().toLowerCase())) {
      setFormError('A terminal with this name already exists in your group.');
      return;
    }
    if (terminalForm.id) {
      setTerminals((current) => current.map((item) => item.id === terminalForm.id ? {
        ...item,
        name: terminalForm.name.trim(),
        municipality: terminalForm.municipality.trim(),
        barangay: terminalForm.barangay.trim() || 'Barangay not set',
        pin: terminalForm.pin.trim() || 'Map pin not set',
      } : item));
      showNotice('Terminal details saved to the local preview.');
    } else {
      const id = `t${Date.now()}`;
      setTerminals((current) => [...current, {
        id,
        name: terminalForm.name.trim(),
        municipality: terminalForm.municipality.trim(),
        barangay: terminalForm.barangay.trim() || 'Barangay not set',
        pin: terminalForm.pin.trim() || 'Map pin not set',
      }]);
      showNotice('Demo terminal added locally.');
    }
    setTerminalForm(null);
  };

  const saveVehicle = () => {
    if (!vehicleForm) return;
    if (!vehicleForm.bodyNumber.trim() || !vehicleForm.plateNumber.trim() || !terminals.some((terminal) => terminal.id === vehicleForm.terminalId)) {
      setFormError('Enter the body number and plate number, then select a group terminal.');
      return;
    }
    if (vehicles.some((vehicle) => vehicle.id !== vehicleForm.id && (vehicle.bodyNumber.toLowerCase() === vehicleForm.bodyNumber.trim().toLowerCase() || vehicle.plateNumber.toLowerCase() === vehicleForm.plateNumber.trim().toLowerCase()))) {
      setFormError('That body number or plate number is already registered in this group.');
      return;
    }
    if (vehicleForm.driverId && (!drivers.some((driver) => driver.id === vehicleForm.driverId && driver.status === 'Approved') || vehicles.some((vehicle) => vehicle.id !== vehicleForm.id && vehicle.driverId === vehicleForm.driverId))) {
      setFormError('Choose an approved driver who is not assigned to another vehicle.');
      return;
    }
    if (vehicleForm.id) {
      setVehicles((current) => current.map((vehicle) => vehicle.id === vehicleForm.id ? {
        ...vehicle,
        bodyNumber: vehicleForm.bodyNumber.trim(),
        plateNumber: vehicleForm.plateNumber.trim() || 'Not added',
        type: vehicleForm.type,
        terminalId: vehicleForm.terminalId,
        driverId: vehicleForm.driverId,
        status: vehicleForm.status,
      } : vehicle));
      showNotice('Vehicle details saved to the local preview.');
    } else {
      const id = `v${Date.now()}`;
      setVehicles((current) => [...current, {
        id,
        bodyNumber: vehicleForm.bodyNumber.trim(),
        plateNumber: vehicleForm.plateNumber.trim() || 'Not added',
        type: vehicleForm.type,
        terminalId: vehicleForm.terminalId,
        driverId: vehicleForm.driverId,
        status: vehicleForm.status,
      }]);
      showNotice('Vehicle added to this demo workspace.');
    }
    setVehicleForm(null);
  };

  const assignDriver = (vehicleId: string, driverId: string | null) => {
    if (driverId && (!drivers.some((driver) => driver.id === driverId && driver.status === 'Approved') || vehicles.some((vehicle) => vehicle.id !== vehicleId && vehicle.driverId === driverId))) {
      showNotice('Choose an approved driver who is not assigned to another vehicle.');
      return;
    }
    setVehicles((current) => current.map((vehicle) => vehicle.id === vehicleId ? { ...vehicle, driverId } : vehicle));
    setAssigningVehicleId(null);
    showNotice(driverId ? 'Driver assignment updated in this preview.' : 'Driver unassigned in this preview.');
  };

  const publishAnnouncement = () => {
    if (!announcementTitle.trim() || !announcementBody.trim()) {
      showNotice('Add a title and message before publishing.');
      return;
    }
    setAnnouncements((current) => [{
      id: `a${Date.now()}`,
      title: announcementTitle.trim(),
      body: announcementBody.trim(),
      time: new Date().toLocaleString(),
    }, ...current]);
    setAnnouncementTitle('');
    setAnnouncementBody('');
    showNotice('Announcement added to the local preview. Nothing was sent.');
  };

  const selectTab = (item: ConsoleTab) => { setTab(item); setNotice(''); setTerminalForm(null); setVehicleForm(null); };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen} onLayout={(event) => setLayoutWidth(event.nativeEvent.layout.width)}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel={terminalForm ? "Back to terminals" : vehicleForm ? "Back to vehicle roster" : tab === "Assignments" ? "Back to vehicle roster" : "Back to login"}>
          <MaterialIcon name="arrowBack" size={21} color={colors.ink} />
        </Pressable>
      </View>

      <View style={[styles.workspace, wide && styles.workspaceWide]}>
      {wide && <View style={[styles.navigation, styles.navigationWide]}>
        <View style={[styles.tabRail, wide && styles.tabRailWide]}>
        {consoleTabs.map((item) => {
          const selected = tab === item;
          return <Pressable key={item}
            onPress={() => selectTab(item)}
            accessibilityRole="tab" accessibilityState={{ selected }}
            style={[styles.tabButton, wide && styles.tabButtonWide, selected && styles.tabButtonSelected]}>
            <MaterialIcon name={tabIcons[item]} size={19} color={selected ? colors.greenDark : colors.muted} />
            <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{item === 'Drivers' && pendingCount ? `Drivers (${pendingCount})` : item}</Text>
          </Pressable>;
        })}
        </View>
        {wide && <Text style={styles.scopeFooter}>Manage terminals, vehicles, and drivers within your assigned group.</Text>}
      </View>}

      <ScrollView ref={scrollRef} style={styles.content} contentContainerStyle={[styles.contentInner, wide && styles.contentInnerWide]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {notice ? <View style={styles.notice} accessibilityRole="alert"><Text style={styles.noticeText}>{notice}</Text><Pressable onPress={() => setNotice('')} accessibilityRole="button" accessibilityLabel="Dismiss message" style={styles.dismissButton}><Text style={styles.formCancel}>Dismiss</Text></Pressable></View> : null}

        <ScreenTransition
          transitionKey={`${tab}:${terminalForm ? `terminal-${terminalForm.id ?? 'new'}` : 'terminal-list'}:${vehicleForm ? `vehicle-${vehicleForm.id ?? 'new'}` : 'vehicle-list'}`}
          style={{ flexGrow: 1, gap: 18 }}
        >
        {tab === 'Overview' && (
          <OverviewTab
            wide={wide}
            terminalCount={terminals.length}
            vehicleCount={vehicles.length}
            activeDriverCount={activeDriverCount}
            pendingCount={pendingCount}
            assignedCount={assignedCount}
            drivers={drivers}
            terminals={terminalRows}
            announcements={announcements}
            onReview={() => { setDriverFilter(pendingCount > 0 ? 'Applications' : 'Roster'); setTab('Drivers'); }}
            onGo={setTab}
          />
        )}
        {tab === 'Terminals' && (
          terminalForm ? <TerminalForm
            form={terminalForm}
            error={formError}
            onChange={setTerminalForm}
            onSave={saveTerminal}
            onCancel={() => setTerminalForm(null)}
          /> : <TerminalsTab
            terminals={terminalRows}
            expandedId={expandedTerminalId}
            onExpand={(id) => setExpandedTerminalId(expandedTerminalId === id ? null : id)}
            onAdd={() => setTerminalForm({ id: null, name: '', municipality: '', barangay: '', pin: '' })}
            onEdit={(item) => setTerminalForm({ id: item.id, name: item.name, municipality: item.municipality, barangay: item.barangay, pin: item.pin })}
            onRemove={(id) => {
              if (vehicles.some((vehicle) => vehicle.terminalId === id)) {
                showNotice('Move this terminal’s vehicles in Assignments before removing it.');
                return;
              }
              setTerminals((current) => current.filter((terminal) => terminal.id !== id));
              setVehicleTerminalFilter(null);
              showNotice('Empty terminal removed from the preview.');
            }}
            onAssignments={() => setTab('Assignments')}
            onRoster={(id) => { setVehicleTerminalFilter(id); setTab('Vehicles'); }}
          />
        )}
        {tab === 'Vehicles' && (
          vehicleForm ? <VehicleForm
            form={vehicleForm}
            error={formError}
            terminals={terminals}
            drivers={drivers}
            vehicles={vehicles}
            onChange={setVehicleForm}
            onSave={saveVehicle}
            onCancel={() => setVehicleForm(null)}
          /> : <VehiclesTab
            vehicles={vehicles}
            terminals={terminals}
            terminalFilter={vehicleTerminalFilter}
            onTerminalFilter={setVehicleTerminalFilter}
            driverName={driverName}
            terminalName={terminalName}
            availableDrivers={availableDrivers}
            assigningVehicleId={assigningVehicleId}
            onAdd={() => setVehicleForm({ id: null, bodyNumber: '', plateNumber: '', type: 'Tricycle', terminalId: vehicleTerminalFilter ?? terminals[0]?.id ?? '', driverId: null, status: 'Needs review' })}
            onEdit={(vehicle) => setVehicleForm({ id: vehicle.id, bodyNumber: vehicle.bodyNumber, plateNumber: vehicle.plateNumber, type: vehicle.type, terminalId: vehicle.terminalId, driverId: vehicle.driverId, status: vehicle.status })}
            onAssign={(id) => setAssigningVehicleId(assigningVehicleId === id ? null : id)}
            onChooseDriver={assignDriver}
            onAssignments={() => setTab('Assignments')}
          />
        )}
        {tab === 'Drivers' && (
          <DriversTab
            drivers={drivers}
            vehicles={vehicles}
            driverFilter={driverFilter}
            setDriverFilter={setDriverFilter}
            onDecision={updateApplication}
            terminalName={terminalName}
            onGoVehicles={() => setTab('Assignments')}
          />
        )}
        {tab === 'Assignments' && <AssignmentsTab vehicles={vehicles} drivers={drivers} terminals={terminals} onSave={(vehicleId, driverId, terminalId) => {
          if (!terminals.some((terminal) => terminal.id === terminalId)) return;
          if (driverId && (!drivers.some((driver) => driver.id === driverId && driver.status === 'Approved') || vehicles.some((vehicle) => vehicle.id !== vehicleId && vehicle.driverId === driverId))) {
            showNotice('This driver is unavailable. Choose an approved, unassigned driver.');
            return;
          }
          setVehicles((current) => current.map((vehicle) => vehicle.id === vehicleId ? { ...vehicle, driverId, terminalId } : vehicle));
          showNotice('Driver and terminal assignments saved in this demo workspace.');
        }} />}
        {tab === 'Updates' && (
          <UpdatesTab
            title={announcementTitle}
            body={announcementBody}
            onTitle={setAnnouncementTitle}
            onBody={setAnnouncementBody}
            onPublish={publishAnnouncement}
            announcements={announcements}
          />
        )}
        </ScreenTransition>

      </ScrollView>
      </View>
      {!wide && !keyboardVisible && <View style={styles.bottomNavigation} accessibilityLabel="Chairperson navigation">
        {(['Overview', 'Terminals', 'Vehicles', 'Drivers', 'Updates'] as const).map((item) => {
          const selected = tab === item || (item === 'Vehicles' && tab === 'Assignments');
          return <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected }}
            accessibilityLabel={item === 'Drivers' ? `Drivers, ${pendingCount} pending applications` : item}
            onPress={() => selectTab(item)}
            style={styles.bottomNavItem}>
            <View style={[styles.bottomNavIcon, selected && styles.bottomNavIconSelected]}>
              <MaterialIcon name={tabIcons[item]} size={22} color={selected ? colors.greenDark : colors.muted} />
              {item === 'Drivers' && pendingCount > 0 && <View style={styles.navigationDot} />}
            </View>
            <Text style={[styles.bottomNavLabel, selected && styles.bottomNavLabelSelected]}>{item === 'Overview' ? 'Dashboard' : item === 'Vehicles' ? 'Fleet' : item}</Text>
          </Pressable>;
        })}
      </View>}
    </KeyboardAvoidingView>
  );
}
