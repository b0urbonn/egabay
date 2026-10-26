import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ComponentRef, ReactNode } from 'react';

import { MaterialIcon, type MaterialIconName } from '../components/MaterialIcon';
import { Button, Card } from '../components/ui';
import { useColors, useThemeStyles } from '../lib/theme';
import { radius, type ThemeColors } from '../theme';

type ConsoleTab = 'Overview' | 'Terminals' | 'Vehicles' | 'Drivers' | 'Assignments' | 'Updates';
type MembershipStatus = 'Pending' | 'Approved' | 'Rejected';

type TerminalRecord = {
  id: string;
  name: string;
  municipality: string;
  barangay: string;
  pin: string;
};

type TerminalRoster = TerminalRecord & { vehicles: number };

type VehicleRecord = {
  id: string;
  bodyNumber: string;
  plateNumber: string;
  type: string;
  terminalId: string;
  driverId: string | null;
  status: 'Active' | 'Needs review' | 'Offline';
};

type DriverRecord = {
  id: string;
  name: string;
  contact: string;
  license: string;
  status: MembershipStatus;
  applied: string;
  decisionAt?: string;
};

type AnnouncementRecord = {
  id: string;
  title: string;
  body: string;
  time: string;
};

const initialTerminals: TerminalRecord[] = [
  { id: 't1', name: 'Boac Town Center', municipality: 'Boac', barangay: 'Demo barangay 1', pin: '13.4460, 121.8400' },
  { id: 't2', name: 'Mogpog Market Stop', municipality: 'Mogpog', barangay: 'Demo barangay 2', pin: '13.4700, 121.8600' },
  { id: 't3', name: 'Gasan Crossing', municipality: 'Gasan', barangay: 'Demo barangay 3', pin: '13.3230, 121.8500' },
];

const initialDrivers: DriverRecord[] = [
  { id: 'd1', name: 'Alex Reyes', contact: '09•• ••• 1427', license: 'XX•••••81', status: 'Pending', applied: 'Today' },
  { id: 'd2', name: 'Jamie Cruz', contact: '09•• ••• 6304', license: 'XX•••••26', status: 'Pending', applied: 'Yesterday' },
  { id: 'd3', name: 'Mika Santos', contact: '09•• ••• 2086', license: 'XX•••••53', status: 'Approved', applied: 'Oct 18' },
  { id: 'd4', name: 'Noel Dizon', contact: '09•• ••• 9150', license: 'XX•••••09', status: 'Approved', applied: 'Oct 11' },
  { id: 'd5', name: 'Ria Mendoza', contact: '09•• ••• 7721', license: 'XX•••••64', status: 'Approved', applied: 'Oct 06' },
];

const initialVehicles: VehicleRecord[] = [
  { id: 'v1', bodyNumber: 'BC-014', plateNumber: 'SAMPLE-014', type: 'Tricycle', terminalId: 't1', driverId: 'd3', status: 'Active' },
  { id: 'v2', bodyNumber: 'BC-021', plateNumber: 'SAMPLE-021', type: 'Tricycle', terminalId: 't1', driverId: 'd4', status: 'Active' },
  { id: 'v3', bodyNumber: 'BC-032', plateNumber: 'SAMPLE-032', type: 'Tricycle', terminalId: 't2', driverId: null, status: 'Needs review' },
  { id: 'v4', bodyNumber: 'BC-045', plateNumber: 'SAMPLE-045', type: 'Jeepney', terminalId: 't3', driverId: null, status: 'Offline' },
];

const initialAnnouncements: AnnouncementRecord[] = [
  { id: 'a1', title: 'Roster check this week', body: 'Please confirm your vehicle details with the terminal lead before Friday.', time: 'Sample · Oct 24' },
];

const tabIcons: Record<ConsoleTab, MaterialIconName> = {
  Overview: 'home',
  Terminals: 'terminals',
  Vehicles: 'liveTrips',
  Drivers: 'person',
  Assignments: 'route',
  Updates: 'notifications',
};

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
  const [driverFilter, setDriverFilter] = useState<'Applications' | 'Roster' | 'Decisions'>('Applications');
  const [terminalForm, setTerminalForm] = useState<{ id: string | null; name: string; municipality: string; barangay: string; pin: string } | null>(null);
  const [vehicleForm, setVehicleForm] = useState<{ id: string | null; bodyNumber: string; plateNumber: string; type: string; terminalId: string; driverId: string | null; status: VehicleRecord['status'] } | null>(null);
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
        {(['Overview', 'Terminals', 'Vehicles', 'Drivers', 'Assignments', 'Updates'] as ConsoleTab[]).map((item) => {
          const selected = tab === item;
          return <Pressable key={item}
            onPress={() => { setTab(item); setNotice(''); setTerminalForm(null); setVehicleForm(null); }}
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
          terminalForm ? <FormPanel title={terminalForm.id ? 'Edit terminal' : 'Add a terminal'} onCancel={() => setTerminalForm(null)}>
            <Input label="Terminal name" value={terminalForm.name} placeholder="e.g. Boac Town Center" onChangeText={(name) => setTerminalForm({ ...terminalForm, name })} />
            <Input label="Municipality" value={terminalForm.municipality} placeholder="e.g. Boac" onChangeText={(municipality) => setTerminalForm({ ...terminalForm, municipality })} />
            <Input label="Barangay" value={terminalForm.barangay} placeholder="Barangay name" onChangeText={(barangay) => setTerminalForm({ ...terminalForm, barangay })} />
            <View style={styles.pinPreview}>
              <View style={styles.pinIcon}><MaterialIcon name="location" size={17} color={colors.green} /></View>
              <View style={styles.pinCopy}>
                <Text style={styles.pinTitle}>Map pin</Text>
                <Text style={styles.pinDetail}>Coordinates for the terminal map pin</Text>
              </View>
            </View>
            <CoordinateFields value={terminalForm.pin} onChange={(pin) => setTerminalForm({ ...terminalForm, pin })} />
            {formError ? <FormError message={formError} /> : null}
            <Button label={terminalForm.id ? 'Save terminal details' : 'Add terminal'} onPress={saveTerminal} />
          </FormPanel> : <TerminalsTab
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
          vehicleForm ? <FormPanel title={vehicleForm.id ? 'Edit vehicle' : 'Add a vehicle'} onCancel={() => setVehicleForm(null)}>
            <Input label="Body / franchise number" value={vehicleForm.bodyNumber} placeholder="e.g. BC-051" onChangeText={(bodyNumber) => setVehicleForm({ ...vehicleForm, bodyNumber })} />
            <Input label="Plate number · group only" value={vehicleForm.plateNumber} placeholder="Enter plate number" autoCapitalize="characters" onChangeText={(plateNumber) => setVehicleForm({ ...vehicleForm, plateNumber })} />
            <Text style={styles.fieldLabel}>VEHICLE TYPE</Text>
            <View style={styles.choiceRow}>
              {['Tricycle', 'Jeepney'].map((type) => <ChoiceChip key={type} label={type} selected={vehicleForm.type === type} onPress={() => setVehicleForm({ ...vehicleForm, type })} />)}
            </View>
            <Text style={styles.fieldLabel}>ASSIGN TO TERMINAL</Text>
            <View style={styles.choiceStack}>
              {terminals.map((terminal) => <ChoiceChip key={terminal.id} label={`${terminal.name} · ${terminal.municipality}`} selected={vehicleForm.terminalId === terminal.id} onPress={() => setVehicleForm({ ...vehicleForm, terminalId: terminal.id })} />)}
            </View>
            <Text style={styles.fieldLabel}>ASSIGNED DRIVER</Text>
            <View style={styles.choiceRow}>
              <ChoiceChip label="Unassigned" selected={!vehicleForm.driverId} onPress={() => setVehicleForm({ ...vehicleForm, driverId: null })} />
              {drivers.filter((driver) => driver.status === 'Approved' && (!vehicles.some((vehicle) => vehicle.id !== vehicleForm.id && vehicle.driverId === driver.id))).map((driver) => <ChoiceChip key={driver.id} label={driver.name} selected={vehicleForm.driverId === driver.id} onPress={() => setVehicleForm({ ...vehicleForm, driverId: driver.id })} />)}
            </View>
            <Text style={styles.fieldLabel}>VEHICLE STATUS</Text>
            <View style={styles.choiceRow}>
              {(['Active', 'Needs review', 'Offline'] as const).map((status) => <ChoiceChip key={status} label={status} selected={vehicleForm.status === status} onPress={() => setVehicleForm({ ...vehicleForm, status })} />)}
            </View>
            {formError ? <FormError message={formError} /> : null}
            <Button label={vehicleForm.id ? 'Save vehicle details' : 'Add vehicle to preview'} onPress={saveVehicle} />
          </FormPanel> : <VehiclesTab
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

      </ScrollView>
      </View>
      {!wide && !keyboardVisible && <View style={styles.bottomNavigation} accessibilityLabel="Chairperson navigation">
        {(['Overview', 'Terminals', 'Vehicles', 'Drivers', 'Updates'] as const).map((item) => {
          const selected = tab === item || (item === 'Vehicles' && tab === 'Assignments');
          return <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected }}
            accessibilityLabel={item === 'Drivers' ? `Drivers, ${pendingCount} pending applications` : item}
            onPress={() => { setTab(item); setTerminalForm(null); setVehicleForm(null); setNotice(''); }}
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

function SearchField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return <View style={styles.searchField}><MaterialIcon name="search" size={20} color={colors.muted} /><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.muted} style={styles.searchInput} /></View>;
}

function FormError({ message }: { message: string }) {
  const styles = useThemeStyles(createStyles);
  return <View style={styles.formError} accessibilityRole="alert"><Text style={styles.formErrorText}>{message}</Text></View>;
}

function CoordinateFields({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const styles = useThemeStyles(createStyles);
  const [latitude = '', longitude = ''] = value.split(',').map((part) => part.trim());
  return <View style={styles.coordinatePicker}>
    <View style={styles.coordinateRow}>
      <View style={styles.coordinateCell}><Input label="Latitude" value={latitude} placeholder="13.4460" onChangeText={(next) => onChange(`${next}, ${longitude}`)} /></View>
      <View style={styles.coordinateCell}><Input label="Longitude" value={longitude} placeholder="121.8400" onChangeText={(next) => onChange(`${latitude}, ${next}`)} /></View>
    </View>
    <Text style={styles.composerHint}>Enter the confirmed terminal coordinates. Latitude: −90 to 90. Longitude: −180 to 180.</Text>
  </View>;
}

function AssignmentsTab({ vehicles, drivers, terminals, onSave }: {
  vehicles: VehicleRecord[];
  drivers: DriverRecord[];
  terminals: TerminalRecord[];
  onSave: (vehicleId: string, driverId: string | null, terminalId: string) => void;
}) {
  const styles = useThemeStyles(createStyles);
  const [selectedId, setSelectedId] = useState(vehicles[0]?.id ?? '');
  const vehicle = vehicles.find((item) => item.id === selectedId) ?? vehicles[0];
  return <>
    <ScreenTitle eyebrow="GROUP OPERATIONS" title="Assignments" subtitle="Assign one approved driver to a vehicle and place that vehicle at a group terminal." />
    <Card style={styles.formPanel}>
      <Text style={styles.fieldLabel}>1. SELECT A VEHICLE</Text>
      <View style={styles.choiceRow}>{vehicles.map((item) => <ChoiceChip key={item.id} label={item.bodyNumber} selected={vehicle?.id === item.id} onPress={() => setSelectedId(item.id)} />)}</View>
      {!vehicle && <EmptyState title="No vehicles to assign" body="Add a terminal and register a vehicle from the Vehicles section first." />}
    </Card>
    {vehicle && <AssignmentEditor key={`${vehicle.id}:${vehicle.driverId}:${vehicle.terminalId}`} vehicle={vehicle} vehicles={vehicles} drivers={drivers} terminals={terminals} onSave={onSave} />}
    <Card style={styles.tipCard}><Text style={styles.tipTitle}>One driver, one vehicle</Text><Text style={styles.tipBody}>Only approved members of this group can be assigned. Move a driver by unassigning their current vehicle first.</Text></Card>
  </>;
}

function AssignmentEditor({ vehicle, vehicles, drivers, terminals, onSave }: {
  vehicle: VehicleRecord;
  vehicles: VehicleRecord[];
  drivers: DriverRecord[];
  terminals: TerminalRecord[];
  onSave: (vehicleId: string, driverId: string | null, terminalId: string) => void;
}) {
  const styles = useThemeStyles(createStyles);
  const [driverId, setDriverId] = useState(vehicle.driverId);
  const [terminalId, setTerminalId] = useState(vehicle.terminalId);
  const candidates = drivers.filter((driver) => driver.status === 'Approved' && !vehicles.some((item) => item.id !== vehicle.id && item.driverId === driver.id));
  const unchanged = driverId === vehicle.driverId && terminalId === vehicle.terminalId;
  return <Card style={styles.formPanel}>
    <Text style={styles.formTitle}>{vehicle.bodyNumber} · {vehicle.type}</Text>
    <Text style={styles.fieldLabel}>2. ASSIGN A DRIVER</Text>
    <View style={styles.choiceRow}>
      <ChoiceChip label="Unassigned" selected={!driverId} onPress={() => setDriverId(null)} />
      {candidates.map((driver) => <ChoiceChip key={driver.id} label={driver.name} selected={driverId === driver.id} onPress={() => setDriverId(driver.id)} />)}
    </View>
    {candidates.length === 0 && <Text style={styles.composerHint}>No approved, unassigned drivers are available. Review pending applications in Drivers.</Text>}
    <Text style={styles.fieldLabel}>3. ASSIGN TO A TERMINAL</Text>
    <View style={styles.choiceStack}>{terminals.map((terminal) => <ChoiceChip key={terminal.id} label={`${terminal.name} · ${terminal.municipality}`} selected={terminalId === terminal.id} onPress={() => setTerminalId(terminal.id)} />)}</View>
    <Button label="Save assignments" disabled={unchanged} onPress={() => onSave(vehicle.id, driverId, terminalId)} />
    <Text style={styles.localOnly}>{unchanged ? 'Select a different driver or terminal to make a change.' : 'Updates apply to the demo workspace.'}</Text>
  </Card>;
}

function OverviewTab({
  wide, terminalCount, vehicleCount, activeDriverCount, pendingCount, assignedCount, drivers, terminals, announcements, onReview, onGo,
}: {
  wide: boolean;
  terminalCount: number;
  vehicleCount: number;
  activeDriverCount: number;
  pendingCount: number;
  assignedCount: number;
  drivers: DriverRecord[];
  terminals: TerminalRecord[];
  announcements: AnnouncementRecord[];
  onReview: () => void;
  onGo: (tab: ConsoleTab) => void;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const pending = drivers.filter((driver) => driver.status === 'Pending').slice(0, 2);
  return (
    <>
      <Text style={styles.pageTitle}>Group overview</Text>
      <Text style={styles.pageSubtitle}>Keep your terminals, roster, and driver applications up to date.</Text>

      <View style={styles.metricGrid}>
        <MetricCard wide={wide} label="Terminals" value={String(terminalCount)} icon="terminals" tone="green" />
        <MetricCard wide={wide} label="Vehicles" value={String(vehicleCount)} icon="liveTrips" tone="blue" />
        <MetricCard wide={wide} label="Approved drivers" value={String(activeDriverCount)} icon="person" tone="purple" />
        <MetricCard wide={wide} label="Pending applications" value={String(pendingCount)} icon="person" tone="orange" />
      </View>

      <Card style={styles.reviewCard}>
        <View style={styles.reviewTop}>
          <View style={styles.reviewIcon}><MaterialIcon name="person" size={19} color={colors.orangeDark} /></View>
          <View style={styles.reviewCopy}>
            <Text style={styles.reviewTitle}>Driver applications</Text>
            <Text style={styles.reviewDetail}>{pendingCount === 0 ? 'No applications waiting' : `${pendingCount} waiting for your review`}</Text>
          </View>
          <View style={styles.pendingPill}><Text style={styles.pendingPillText}>{pendingCount}</Text></View>
        </View>
        {pending.map((driver) => <View key={driver.id} style={styles.pendingPreviewRow}>
          <View style={styles.miniAvatar}><Text style={styles.miniAvatarText}>{initials(driver.name)}</Text></View>
          <Text style={styles.pendingName}>{driver.name}</Text>
          <Text style={styles.pendingApplied}>{driver.applied}</Text>
        </View>)}
        <Button label={pendingCount === 0 ? 'View driver roster' : 'Review applications'} variant="secondary" onPress={onReview} />
      </Card>

      <SectionHeading title="Group operations" action="Manage" onAction={() => onGo('Terminals')} />
      <Card style={styles.operationsCard}>
        <OperationRow icon="terminals" title="Terminals" detail={`${terminals.length} locations · review map pins`} onPress={() => onGo('Terminals')} />
        <View style={styles.rowDivider} />
        <OperationRow icon="liveTrips" title="Vehicle roster" detail={`${vehicleCount} vehicles · ${vehicleCount - assignedCount} unassigned`} onPress={() => onGo('Vehicles')} />
        <View style={styles.rowDivider} />
        <OperationRow icon="route" title="Assignments" detail="Assign drivers and move vehicles between terminals" onPress={() => onGo('Assignments')} />
        <View style={styles.rowDivider} />
        <OperationRow icon="notifications" title="Group updates" detail={`${announcements.length} recent announcement${announcements.length === 1 ? '' : 's'}`} onPress={() => onGo('Updates')} />
      </Card>

    </>
  );
}

function TerminalsTab({
  terminals, expandedId, onExpand, onAdd, onEdit, onRemove, onRoster, onAssignments,
}: {
  terminals: TerminalRoster[];
  expandedId: string | null;
  onExpand: (id: string) => void;
  onAdd: () => void;
  onEdit: (terminal: TerminalRecord) => void;
  onRemove: (id: string) => void;
  onRoster: (id: string) => void;
  onAssignments: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const shownTerminals = terminals.filter((terminal) => `${terminal.name} ${terminal.municipality} ${terminal.barangay}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <>
      <ScreenTitle eyebrow="GROUP LOCATIONS" title="Terminals" subtitle="Add locations and keep each group pin current." />
      <SearchField label="Search terminals" value={query} onChange={setQuery} placeholder="Terminal, municipality, or barangay" />
      <Button label="Add terminal" glyph="+" onPress={onAdd} />
      <View style={styles.listSectionHeading}>
        <Text style={styles.listCount}>{terminals.length} TERMINALS</Text>
        <Text style={styles.sampleCount}>Sample records</Text>
      </View>
      {terminals.length === 0 && <EmptyState title="No terminals yet" body="Add your first group terminal with its municipality, barangay, and coordinates." />}
      {terminals.length > 0 && shownTerminals.length === 0 && <EmptyState title="No matching terminals" body="Try a different terminal name or locality." />}
      {shownTerminals.map((terminal) => {
        const expanded = expandedId === terminal.id;
        return <Card key={terminal.id} style={styles.terminalCard}>
          <Pressable onPress={() => onExpand(terminal.id)} style={styles.terminalTop} accessibilityRole="button" accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${terminal.name}`}>
            <View style={styles.terminalIcon}><MaterialIcon name="terminals" size={19} color={colors.green} /></View>
            <View style={styles.terminalCopy}>
              <Text style={styles.terminalName}>{terminal.name}</Text>
              <Text style={styles.terminalLocality}>{terminal.barangay} · {terminal.municipality}</Text>
            </View>
            <View style={styles.vehicleCountBadge}><Text style={styles.vehicleCount}>{terminal.vehicles}</Text><Text style={styles.vehicleCountLabel}>Vehicles</Text></View>
          </Pressable>
          {expanded && <View style={styles.expandedDetails}>
            <View style={styles.detailLine}><MaterialIcon name="location" size={15} color={colors.muted} /><Text style={styles.detailLineText}>{terminal.pin}</Text><Text style={styles.pinLabel}>MAP PIN</Text></View>
            {confirmingId === terminal.id && terminal.vehicles > 0 ? <View style={styles.deleteConfirm}><Text style={styles.deleteConfirmText}>Move all {terminal.vehicles} vehicles to another terminal before removing this location.</Text><Button label="Open assignments" variant="secondary" onPress={onAssignments} /></View> : confirmingId === terminal.id ? <View style={styles.deleteConfirm}>
              <Text style={styles.deleteConfirmText}>Remove this empty terminal?</Text>
              <View style={styles.terminalActions}>
                <Pressable onPress={() => setConfirmingId(null)} style={styles.keepButton}><Text style={styles.keepButtonText}>Keep terminal</Text></Pressable>
                <Pressable onPress={() => { onRemove(terminal.id); setConfirmingId(null); }} style={styles.removeButton}><Text style={styles.removeButtonText}>Remove</Text></Pressable>
              </View>
            </View> : <>
              <View style={styles.terminalActions}>
                <MiniAction label="Edit details" icon="settings" onPress={() => onEdit(terminal)} />
                <MiniAction label="Vehicle roster" icon="liveTrips" onPress={() => onRoster(terminal.id)} />
              </View>
              <Pressable onPress={() => setConfirmingId(terminal.id)} style={styles.removeTerminalLink}><Text style={styles.removeTerminalText}>Remove terminal from preview</Text></Pressable>
            </>}
          </View>}
        </Card>;
      })}
      <Card style={styles.tipCard}>
        <Text style={styles.tipTitle}>Keep terminal details current</Text>
        <Text style={styles.tipBody}>Riders rely on a correct municipality, barangay, and map pin. Confirm each location with your group before publishing.</Text>
      </Card>
    </>
  );
}

function VehiclesTab({
  vehicles, terminals, terminalFilter, onTerminalFilter, driverName, terminalName, availableDrivers, assigningVehicleId, onAdd, onEdit, onAssign, onChooseDriver, onAssignments,
}: {
  vehicles: VehicleRecord[];
  terminals: TerminalRecord[];
  terminalFilter: string | null;
  onTerminalFilter: (id: string | null) => void;
  driverName: (id: string | null) => string;
  terminalName: (id: string) => string;
  availableDrivers: DriverRecord[];
  assigningVehicleId: string | null;
  onAdd: () => void;
  onEdit: (vehicle: VehicleRecord) => void;
  onAssign: (id: string) => void;
  onChooseDriver: (vehicleId: string, driverId: string | null) => void;
  onAssignments: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const filtered = vehicles.filter((vehicle) =>
    (filter === 'All' || vehicle.type === filter) &&
    (!terminalFilter || vehicle.terminalId === terminalFilter) &&
    `${vehicle.bodyNumber} ${vehicle.plateNumber} ${driverName(vehicle.driverId)}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <ScreenTitle eyebrow="FLEET MANAGEMENT" title="Vehicle roster" subtitle="Manage group vehicles and their terminal and driver assignments." />
      <SearchField label="Search vehicles" value={query} onChange={setQuery} placeholder="Body number, plate, or driver" />
      <Button label="Add vehicle" glyph="+" disabled={terminals.length === 0} onPress={onAdd} />
      {terminals.length === 0 && <EmptyState title="Add a terminal first" body="Every vehicle must belong to a group terminal. Create a location in Terminals before registering a vehicle." />}
      <View style={styles.chipRow}>
        {['All', 'Tricycle', 'Jeepney'].map((item) => <ChoiceChip key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} />)}
      </View>
      {terminalFilter && <View style={styles.chipRow}><ChoiceChip label={`Terminal: ${terminalName(terminalFilter)} ×`} selected onPress={() => onTerminalFilter(null)} /></View>}
      <Text style={styles.listCount}>{filtered.length} PREVIEW RECORDS</Text>
      {filtered.length === 0 ? <EmptyState title="No vehicles in this view" body="Add a group vehicle to start its roster." /> : filtered.map((vehicle) => (
        <Card key={vehicle.id} style={styles.vehicleCard}>
          <View style={styles.vehicleCardTop}>
            <View style={styles.vehicleIcon}><MaterialIcon name="liveTrips" size={19} color={colors.green} /></View>
            <View style={styles.vehicleTitleCopy}>
              <Text style={styles.vehicleBodyNumber}>{vehicle.bodyNumber}</Text>
              <Text style={styles.vehicleType}>{vehicle.type} · plate {vehicle.plateNumber}</Text>
            </View>
            <StatusPill label={vehicle.status} tone={vehicle.status === 'Active' ? 'green' : vehicle.status === 'Offline' ? 'gray' : 'orange'} />
          </View>
          <View style={styles.vehicleMetaRow}>
            <MaterialIcon name="terminals" size={14} color={colors.muted} />
            <Text style={styles.vehicleMetaText}>{terminalName(vehicle.terminalId)}</Text>
          </View>
          <View style={styles.assignmentBox}>
            <View style={styles.assignmentPerson}><View style={styles.smallAvatar}><MaterialIcon name="person" size={14} color={colors.green} /></View><Text style={styles.assignmentName}>{driverName(vehicle.driverId)}</Text></View>
            <Pressable onPress={() => onAssign(vehicle.id)} style={styles.assignLink} accessibilityRole="button">
              <Text style={styles.assignLinkText}>{vehicle.driverId ? 'Change' : 'Assign'}</Text>
            </Pressable>
          </View>
          {assigningVehicleId === vehicle.id && <View style={styles.driverPicker}>
            <Text style={styles.driverPickerTitle}>Choose an approved, unassigned driver</Text>
            {vehicle.driverId && <Pressable style={styles.driverChoice} onPress={() => onChooseDriver(vehicle.id, null)}><Text style={styles.driverChoiceText}>Unassign current driver</Text></Pressable>}
            {availableDrivers.map((driver) => <Pressable key={driver.id} style={styles.driverChoice} onPress={() => onChooseDriver(vehicle.id, driver.id)}><Text style={styles.driverChoiceText}>{driver.name}</Text><Text style={styles.driverChoiceMeta}>Approved</Text></Pressable>)}
            {availableDrivers.length === 0 && !vehicle.driverId && <Text style={styles.emptyPickerText}>No approved drivers are available to assign.</Text>}
          </View>}
          <View style={styles.vehicleActions}>
            <MiniAction label="Edit vehicle" icon="settings" onPress={() => onEdit(vehicle)} />
          <MiniAction label="Assignments" icon="route" onPress={onAssignments} />
          </View>
        </Card>
      ))}
      <Text style={styles.privacyFootnote}>Plate numbers are visible to the group chairperson and are not part of public vehicle listings.</Text>
      <Text style={styles.hiddenMeta}>{terminals.length} terminals configured for this sample group.</Text>
    </>
  );
}

function DriversTab({
  drivers, vehicles, terminalName, driverFilter, setDriverFilter, onDecision, onGoVehicles,
}: {
  drivers: DriverRecord[];
  vehicles: VehicleRecord[];
  terminalName: (id: string) => string;
  driverFilter: 'Applications' | 'Roster' | 'Decisions';
  setDriverFilter: (filter: 'Applications' | 'Roster' | 'Decisions') => void;
  onDecision: (id: string, status: 'Approved' | 'Rejected') => void;
  onGoVehicles: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const pending = drivers.filter((driver) => driver.status === 'Pending');
  const roster = drivers.filter((driver) => driver.status === 'Approved');
  const decisions = drivers.filter((driver) => driver.decisionAt);
  const selected = driverFilter === 'Applications' ? pending : driverFilter === 'Roster' ? roster : decisions;
  const [decision, setDecision] = useState<{ id: string; status: 'Approved' | 'Rejected' } | null>(null);
  const assignedVehicle = (driver: DriverRecord) => vehicles.find((vehicle) => vehicle.driverId === driver.id);
  return (
    <>
      <ScreenTitle eyebrow="MEMBERSHIP" title="Drivers" subtitle="Review applications and check your group's approved driver roster." />
      <View style={styles.segmented}>
        {(['Applications', 'Roster', 'Decisions'] as const).map((item) => {
          const selectedTab = driverFilter === item;
          const count = item === 'Applications' ? pending.length : item === 'Roster' ? roster.length : decisions.length;
          return <Pressable key={item} onPress={() => setDriverFilter(item)} style={[styles.segment, selectedTab && styles.segmentSelected]} accessibilityRole="tab" accessibilityState={{ selected: selectedTab }}>
            <Text style={[styles.segmentText, selectedTab && styles.segmentTextSelected]}>{item}</Text><Text style={[styles.segmentCount, selectedTab && styles.segmentCountSelected]}>{count}</Text>
          </Pressable>;
        })}
      </View>
      {driverFilter === 'Applications' && pending.length > 0 && <View style={styles.reviewGuidance}><MaterialIcon name="assistant" size={17} color={colors.orangeDark} /><Text style={styles.reviewGuidanceText}>Check membership and license details before approving an application.</Text></View>}
      <Text style={styles.listCount}>{driverFilter === 'Applications' ? `${pending.length} WAITING FOR REVIEW` : driverFilter === 'Roster' ? `${roster.length} APPROVED DRIVERS` : `${decisions.length} APPLICATION DECISIONS`}</Text>
      {selected.length === 0 ? <EmptyState title={driverFilter === 'Applications' ? 'You’re all caught up' : driverFilter === 'Decisions' ? 'No reviewed applications' : 'No approved drivers yet'} body={driverFilter === 'Applications' ? 'New group applications will appear here.' : driverFilter === 'Decisions' ? 'Your approval and rejection decisions will appear here.' : 'Approved members will appear in your roster.'} /> : selected.map((driver) => {
        const assignment = assignedVehicle(driver);
        return <Card key={driver.id} style={styles.driverCard}>
          <View style={styles.driverCardTop}>
            <View style={styles.driverAvatar}><Text style={styles.driverAvatarText}>{initials(driver.name)}</Text></View>
            <View style={styles.driverNameCopy}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <Text style={styles.driverApplied}>{driverFilter === 'Applications' ? `Applied ${driver.applied.toLowerCase()}` : driverFilter === 'Decisions' ? `Reviewed ${driver.decisionAt}` : 'Approved group member'}</Text>
            </View>
            <StatusPill label={driver.status} tone={driver.status === 'Pending' ? 'orange' : driver.status === 'Rejected' ? 'gray' : 'green'} />
          </View>
          <View style={styles.driverInfoGrid}>
            <View style={styles.driverInfoCell}><Text style={styles.driverInfoLabel}>CONTACT</Text><Text style={styles.driverInfoValue}>{driver.contact}</Text></View>
            <View style={styles.driverInfoCell}><Text style={styles.driverInfoLabel}>LICENSE</Text><Text style={styles.driverInfoValue}>{driver.license}</Text></View>
          </View>
          {driverFilter === 'Applications' && decision?.id === driver.id ? <View style={styles.deleteConfirm}>
            <Text style={styles.deleteConfirmText}>{decision.status === 'Approved' ? 'Approve' : 'Reject'} {driver.name}’s application to Boac Central TODA?</Text>
            <View style={styles.decisionRow}><Button label="Cancel" variant="ghost" style={styles.decisionButton} onPress={() => setDecision(null)} /><Button label="Confirm" style={styles.decisionButton} onPress={() => { onDecision(driver.id, decision.status); setDecision(null); }} /></View>
          </View> : driverFilter === 'Applications' ? <View style={styles.decisionRow}>
            <Button label="Reject" variant="ghost" onPress={() => setDecision({ id: driver.id, status: 'Rejected' })} style={styles.decisionButton} />
            <Button label="Approve driver" onPress={() => setDecision({ id: driver.id, status: 'Approved' })} style={styles.decisionButton} />
          </View> : driverFilter === 'Decisions' ? <Text style={styles.privacyFootnote}>{driver.status === 'Approved' ? 'Approved for group membership.' : 'Application rejected. This driver cannot be assigned to a vehicle.'}</Text> : <View style={styles.rosterAssignment}>
            <Text style={styles.driverInfoLabel}>VEHICLE ASSIGNMENT</Text>
            {assignment ? <Text style={styles.rosterVehicle}>{assignment.bodyNumber} · {terminalName(assignment.terminalId)}</Text> : <Pressable onPress={onGoVehicles}><Text style={styles.rosterUnassigned}>No vehicle · Assign one</Text></Pressable>}
          </View>}
        </Card>;
      })}
      <Text style={styles.privacyFootnote}>Contact and license details are shown only in this group management preview.</Text>
    </>
  );
}

function UpdatesTab({
  title, body, onTitle, onBody, onPublish, announcements,
}: {
  title: string;
  body: string;
  onTitle: (value: string) => void;
  onBody: (value: string) => void;
  onPublish: () => void;
  announcements: AnnouncementRecord[];
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return (
    <>
      <ScreenTitle eyebrow="GROUP COMMUNICATION" title="Announcements" subtitle="Share a clear, timely update with drivers in your group." />
      <Card style={styles.composerCard}>
        <Text style={styles.composerHeading}>New announcement</Text>
        <Text style={styles.fieldLabel}>AUDIENCE</Text>
        <View style={styles.audienceSelector}><MaterialIcon name="person" size={17} color={colors.green} /><Text style={styles.audienceText}>Drivers in Boac Central TODA</Text><Text style={styles.audienceTag}>GROUP</Text></View>
        <Input label="Title" value={title} placeholder="What do drivers need to know?" onChangeText={onTitle} />
        <Input label="Message" value={body} placeholder="Add the details, date, and any action drivers should take." onChangeText={onBody} multiline />
        <Text style={styles.composerHint}>Include when the update starts and who drivers can contact with questions.</Text>
        <Button label="Publish announcement" disabled={!title.trim() || !body.trim()} onPress={onPublish} />
        <Text style={styles.localOnly}>Preview action only · Nothing will be sent</Text>
      </Card>
      <SectionHeading title="Recent updates" />
      {announcements.map((announcement) => <Card key={announcement.id} style={styles.announcementCard}>
        <View style={styles.announcementTop}><View style={styles.updateIcon}><MaterialIcon name="notifications" size={16} color={colors.green} /></View><Text style={styles.announcementTime}>{announcement.time} · Chairperson</Text></View>
        <Text style={styles.announcementTitle}>{announcement.title}</Text>
        <Text style={styles.announcementBody}>{announcement.body}</Text>
        <View style={styles.audienceFooter}><MaterialIcon name="person" size={13} color={colors.muted} /><Text style={styles.audienceFooterText}>Visible to group drivers</Text></View>
      </Card>)}
    </>
  );
}

function MetricCard({ wide, label, value, icon, tone }: { wide: boolean; label: string; value: string; icon: MaterialIconName; tone: 'green' | 'blue' | 'purple' | 'orange' }) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const iconColor = tone === 'blue' ? colors.blue : tone === 'purple' ? colors.purple : tone === 'orange' ? colors.orange : colors.green;
  return <Card style={[styles.metricCard, wide && styles.metricCardWide]}>
    <View style={[styles.metricIcon, tone === 'blue' && styles.metricBlue, tone === 'purple' && styles.metricPurple, tone === 'orange' && styles.metricOrange]}><MaterialIcon name={icon} size={17} color={iconColor} /></View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </Card>;
}

function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return <View style={styles.sectionHeading}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && <Pressable onPress={onAction} style={styles.sectionAction}><Text style={styles.sectionActionText}>{action}</Text><MaterialIcon name="chevronRight" size={15} color={colors.green} /></Pressable>}
  </View>;
}

function OperationRow({ icon, title, detail, onPress }: { icon: MaterialIconName; title: string; detail: string; onPress: () => void }) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.operationRow, pressed && styles.pressed]}>
    <View style={styles.operationIcon}><MaterialIcon name={icon} size={17} color={colors.green} /></View>
    <View style={styles.operationCopy}><Text style={styles.operationTitle}>{title}</Text><Text style={styles.operationDetail}>{detail}</Text></View>
    <MaterialIcon name="chevronRight" size={17} color={colors.muted} />
  </Pressable>;
}

function ScreenTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  const styles = useThemeStyles(createStyles);
  return <View style={styles.screenTitleBlock}><Text style={styles.screenEyebrow}>{eyebrow}</Text><Text style={styles.screenHeading}>{title}</Text><Text style={styles.screenSubtitle}>{subtitle}</Text></View>;
}

function MiniAction({ label, icon, onPress }: { label: string; icon: MaterialIconName; onPress: () => void }) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.miniAction}><MaterialIcon name={icon} size={15} color={colors.green} /><Text style={styles.miniActionText}>{label}</Text></Pressable>;
}

function StatusPill({ label, tone }: { label: string; tone: 'green' | 'orange' | 'gray' }) {
  const styles = useThemeStyles(createStyles);
  return <View style={[styles.statusPill, tone === 'orange' && styles.statusPillOrange, tone === 'gray' && styles.statusPillGray]}><Text style={[styles.statusPillText, tone === 'orange' && styles.statusPillTextOrange, tone === 'gray' && styles.statusPillTextGray]}>{label}</Text></View>;
}

function ChoiceChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const styles = useThemeStyles(createStyles);
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} style={[styles.choiceChip, selected && styles.choiceChipSelected]}><Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>{label}</Text></Pressable>;
}

function Input({
  label, value, placeholder, onChangeText, multiline = false, autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  return <View style={styles.inputGroup}>
    <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      accessibilityLabel={label}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={[styles.input, multiline && styles.multilineInput]}
    />
  </View>;
}

function FormPanel({ children, title, onCancel }: { children: ReactNode; title: string; onCancel: () => void }) {
  const styles = useThemeStyles(createStyles);
  return <Card style={styles.formPanel}>
    <View style={styles.formHeadingRow}><Text style={styles.formTitle}>{title}</Text><Pressable onPress={onCancel} style={styles.dismissButton} accessibilityRole="button" accessibilityLabel="Close form"><Text style={styles.formCancel}>Cancel</Text></Pressable></View>
    {children}
    <Text style={styles.localOnly}>Demo changes reset when you leave this workspace</Text>
  </Card>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  const styles = useThemeStyles(createStyles);
  return <Card style={styles.emptyState}><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text></Card>;
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    bottomNavigation: { flexShrink: 0, minHeight: 76, flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card, paddingHorizontal: 6, paddingTop: 8, paddingBottom: 10 },
    bottomNavItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 54 },
    bottomNavIcon: { width: 44, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    bottomNavIconSelected: { backgroundColor: colors.greenLight },
    bottomNavLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' },
    bottomNavLabelSelected: { color: colors.greenDark },
    navigationDot: { position: 'absolute', top: 2, right: 5, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.orange, borderWidth: 1, borderColor: colors.card },
    searchField: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.card, paddingHorizontal: 14 },
    searchInput: { flex: 1, minWidth: 0, minHeight: 46, color: colors.ink, fontSize: 14 },
    workspace: { flex: 1, minHeight: 0 },
    workspaceWide: { flexDirection: 'row' },
    navigation: { flexShrink: 0, backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.line },
    navigationWide: { width: 240, borderRightWidth: 1, borderBottomWidth: 0, paddingVertical: 24 },
    tabRailWide: { flexDirection: 'column', flexWrap: 'nowrap', gap: 8, paddingHorizontal: 16 },
    tabButtonWide: { width: '100%', flexGrow: 0, justifyContent: 'flex-start', paddingHorizontal: 16, minHeight: 48 },
    scopeFooter: { color: colors.muted, fontSize: 12, lineHeight: 19, margin: 24 },
    contentInnerWide: { paddingHorizontal: 36, paddingTop: 28 },
    metricCardWide: { width: '22%' },
    coordinatePicker: { gap: 10 },
    coordinateRow: { flexDirection: 'row', gap: 12 },
    coordinateCell: { flex: 1, minWidth: 0 },
    formError: { padding: 12, borderRadius: 12, backgroundColor: colors.orangeLight },
    formErrorText: { color: colors.red, fontSize: 14, lineHeight: 21 },
    dismissButton: { minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' },
    screen: { flex: 1, backgroundColor: colors.canvas },
    header: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17, paddingTop: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.card },
    backButton: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
    tabRail: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 10 },
    tabButton: { width: '31%', flexGrow: 1, minHeight: 44, paddingHorizontal: 6, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: colors.canvas },
    tabButtonSelected: { backgroundColor: colors.greenLight },
    tabText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
    tabTextSelected: { color: colors.greenDark },
    content: { flex: 1, minWidth: 0 },
    contentInner: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 36, gap: 18, width: '100%', maxWidth: 1120, alignSelf: 'center' },
    notice: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.greenLight, borderRadius: radius.md, padding: 11, borderWidth: 1, borderColor: colors.line },
    noticeText: { flex: 1, color: colors.greenDark, fontSize: 14, lineHeight: 20, fontWeight: '700' },
    pageTitle: { color: colors.ink, fontSize: 30, lineHeight: 35, fontWeight: '800', letterSpacing: -0.8, marginTop: 4 },
    pageSubtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: -10 },
    metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    metricCard: { width: '46%', flexGrow: 1, padding: 18, minHeight: 130 },
    metricIcon: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenLight, marginBottom: 8 },
    metricBlue: { backgroundColor: colors.blueLight },
    metricPurple: { backgroundColor: colors.purpleLight },
    metricOrange: { backgroundColor: colors.orangeLight },
    metricValue: { color: colors.ink, fontSize: 28, lineHeight: 28, fontWeight: '800', letterSpacing: -0.5 },
    metricLabel: { color: colors.muted, fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 2 },
    reviewCard: { padding: 13, gap: 9, borderColor: colors.connectBorder },
    reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 2 },
    reviewIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.orangeLight, alignItems: 'center', justifyContent: 'center' },
    reviewCopy: { flex: 1, gap: 3 },
    reviewTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
    reviewDetail: { color: colors.muted, fontSize: 13, fontWeight: '600' },
    pendingPill: { minWidth: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, backgroundColor: colors.orange },
    pendingPillText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
    pendingPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
    miniAvatar: { width: 25, height: 25, borderRadius: 9, backgroundColor: colors.orangeLight, alignItems: 'center', justifyContent: 'center' },
    miniAvatarText: { color: colors.orangeDark, fontSize: 11, fontWeight: '900' },
    pendingName: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '700' },
    pendingApplied: { color: colors.muted, fontSize: 12, fontWeight: '600' },
    operationsCard: { paddingHorizontal: 12, paddingVertical: 3 },
    sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
    sectionAction: { flexDirection: 'row', alignItems: 'center' },
    sectionActionText: { color: colors.greenDark, fontSize: 13, fontWeight: '800' },
    operationRow: { minHeight: 55, flexDirection: 'row', alignItems: 'center', gap: 10 },
    operationIcon: { width: 31, height: 31, borderRadius: 10, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
    operationCopy: { flex: 1, gap: 3 },
    operationTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
    operationDetail: { color: colors.muted, fontSize: 12, fontWeight: '600' },
    rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: 41 },
    screenTitleBlock: { gap: 5, marginTop: 2, marginBottom: 1 },
    screenEyebrow: { color: colors.greenDark, fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
    screenHeading: { color: colors.ink, fontSize: 30, lineHeight: 34, letterSpacing: -0.7, fontWeight: '800' },
    screenSubtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, maxWidth: 640 },
    listSectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    listCount: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, marginTop: 3, marginBottom: 0 },
    sampleCount: { color: colors.orangeDark, fontSize: 12, fontWeight: '700' },
    terminalCard: { padding: 18, gap: 14 },
    terminalTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    terminalIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
    terminalCopy: { flex: 1, gap: 4 },
    terminalName: { color: colors.ink, fontSize: 15, fontWeight: '800' },
    terminalLocality: { color: colors.muted, fontSize: 12, fontWeight: '600' },
    vehicleCountBadge: { minWidth: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 11, paddingHorizontal: 6, paddingVertical: 5, backgroundColor: colors.canvas },
    vehicleCount: { color: colors.ink, fontSize: 16, lineHeight: 20, fontWeight: '800' },
    vehicleCountLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
    expandedDetails: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10, gap: 10 },
    detailLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailLineText: { flex: 1, color: colors.muted, fontSize: 13, fontWeight: '600' },
    pinLabel: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
    terminalActions: { flexDirection: 'row', gap: 8 },
    miniAction: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderColor: colors.line, borderRadius: 11, backgroundColor: colors.card },
    miniActionText: { color: colors.greenDark, fontSize: 12, fontWeight: '800' },
    removeTerminalLink: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 3 },
    removeTerminalText: { color: colors.red, fontSize: 11, fontWeight: '700' },
    deleteConfirm: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 9, gap: 8 },
    deleteConfirmText: { color: colors.red, fontSize: 13, fontWeight: '700' },
    keepButton: { flex: 1, minHeight: 44, borderRadius: 11, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    keepButtonText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
    removeButton: { flex: 1, minHeight: 44, borderRadius: 11, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
    removeButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
    tipCard: { backgroundColor: colors.tipBg, borderColor: colors.greenLight, gap: 5 },
    tipTitle: { color: colors.greenDark, fontSize: 14, fontWeight: '800' },
    tipBody: { color: colors.tipBody, fontSize: 13, lineHeight: 19 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginVertical: 1 },
    choiceChip: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
    choiceChipSelected: { backgroundColor: colors.greenLight, borderColor: colors.green },
    choiceChipText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
    choiceChipTextSelected: { color: colors.greenDark },
    vehicleCard: { padding: 18, gap: 14 },
    vehicleCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    vehicleIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
    vehicleTitleCopy: { flex: 1, gap: 3 },
    vehicleBodyNumber: { color: colors.ink, fontSize: 16, fontWeight: '900' },
    vehicleType: { color: colors.muted, fontSize: 11, fontWeight: '600' },
    statusPill: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: colors.greenLight },
    statusPillOrange: { backgroundColor: colors.orangeLight },
    statusPillGray: { backgroundColor: colors.chipBg, borderWidth: 1, borderColor: colors.line },
    statusPillText: { flexShrink: 1, color: colors.greenDark, fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
    statusPillTextOrange: { color: colors.orangeDark },
    statusPillTextGray: { color: colors.muted },
    vehicleMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    vehicleMetaText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
    assignmentBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderRadius: 11, backgroundColor: colors.canvas },
    assignmentPerson: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
    smallAvatar: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenLight },
    assignmentName: { color: colors.ink, fontSize: 12, fontWeight: '700' },
    assignLink: { paddingHorizontal: 12, minHeight: 44, justifyContent: 'center' },
    assignLinkText: { color: colors.greenDark, fontSize: 12, fontWeight: '900' },
    vehicleActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    driverPicker: { padding: 9, borderWidth: 1, borderColor: colors.line, borderRadius: 11, gap: 3 },
    driverPickerTitle: { color: colors.muted, fontSize: 11, fontWeight: '800', marginBottom: 3 },
    driverChoice: { minHeight: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
    driverChoiceText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
    driverChoiceMeta: { color: colors.greenDark, fontSize: 11, fontWeight: '800' },
    emptyPickerText: { color: colors.muted, fontSize: 12, lineHeight: 18, paddingTop: 4 },
    statusAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 1 },
    statusActionText: { color: colors.greenDark, fontSize: 12, fontWeight: '800' },
    privacyFootnote: { color: colors.muted, fontSize: 12, lineHeight: 18, paddingHorizontal: 2 },
    hiddenMeta: { color: colors.muted, fontSize: 11 },
    segmented: { flexDirection: 'row', gap: 5, backgroundColor: colors.fill, borderRadius: 14, padding: 4 },
    segment: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 11 },
    segmentSelected: { backgroundColor: colors.card },
    segmentText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
    segmentTextSelected: { color: colors.ink },
    segmentCount: { color: colors.muted, fontSize: 11, fontWeight: '800' },
    segmentCountSelected: { color: colors.green },
    reviewGuidance: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, backgroundColor: colors.orangeLight },
    reviewGuidanceText: { flex: 1, color: colors.orangeDark, fontSize: 12, lineHeight: 18, fontWeight: '700' },
    driverCard: { padding: 18, gap: 14 },
    driverCardTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    driverAvatar: { width: 37, height: 37, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueLight },
    driverAvatarText: { color: colors.blue, fontSize: 13, fontWeight: '900' },
    driverNameCopy: { flex: 1, gap: 3 },
    driverName: { color: colors.ink, fontSize: 15, fontWeight: '800' },
    driverApplied: { color: colors.muted, fontSize: 11, fontWeight: '600' },
    driverInfoGrid: { flexDirection: 'row', gap: 8, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
    driverInfoCell: { flex: 1, gap: 4 },
    driverInfoLabel: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 0.75 },
    driverInfoValue: { color: colors.ink, fontSize: 13, fontWeight: '700' },
    decisionRow: { flexDirection: 'row', gap: 8 },
    decisionButton: { flex: 1, minHeight: 48 },
    rosterAssignment: { gap: 5 },
    rosterVehicle: { color: colors.ink, fontSize: 13, fontWeight: '700' },
    rosterUnassigned: { color: colors.greenDark, fontSize: 13, fontWeight: '800' },
    composerCard: { padding: 13, gap: 10 },
    composerHeading: { color: colors.ink, fontSize: 16, fontWeight: '800', marginBottom: 1 },
    fieldLabel: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 0.85 },
    audienceSelector: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, borderRadius: 11, backgroundColor: colors.greenLight },
    audienceText: { flex: 1, color: colors.greenDark, fontSize: 12, fontWeight: '800' },
    audienceTag: { color: colors.green, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    inputGroup: { gap: 5 },
    input: { minHeight: 48, borderRadius: 11, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, paddingHorizontal: 11, paddingVertical: 10, color: colors.ink, fontSize: 13, fontWeight: '600' },
    multilineInput: { minHeight: 100, lineHeight: 19 },
    composerHint: { color: colors.muted, fontSize: 11, lineHeight: 18 },
    localOnly: { textAlign: 'center', color: colors.muted, fontSize: 11, fontWeight: '600' },
    announcementCard: { padding: 12, gap: 7 },
    announcementTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    updateIcon: { width: 25, height: 25, borderRadius: 8, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
    announcementTime: { color: colors.muted, fontSize: 11, fontWeight: '700' },
    announcementTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
    announcementBody: { color: colors.muted, fontSize: 12, lineHeight: 18 },
    audienceFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
    audienceFooterText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
    formPanel: { padding: 20, gap: 18, borderColor: colors.green },
    formHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    formTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
    formCancel: { color: colors.greenDark, fontSize: 13, fontWeight: '800' },
    pinPreview: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pinIcon: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenLight },
    pinCopy: { gap: 2 },
    pinTitle: { color: colors.ink, fontSize: 12, fontWeight: '800' },
    pinDetail: { color: colors.muted, fontSize: 11 },
    choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    choiceStack: { gap: 6 },
    emptyState: { padding: 17, alignItems: 'center', gap: 5 },
    emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
    emptyBody: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
    pressed: { opacity: 0.78 },
  });
}
