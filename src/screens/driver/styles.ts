import { Platform, StyleSheet } from 'react-native';

import { spacing, type ThemeColors } from '../../theme';

export function createStyles(colors: ThemeColors) {
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

    appearanceControl: { minHeight: 50, flexDirection: 'row', backgroundColor: colors.fill, borderRadius: 13, padding: 3, gap: 2 },
    appearanceOption: { flex: 1, minHeight: 44, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 4 },
    appearanceOptionSelected: { backgroundColor: colors.card, shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 3, elevation: 2 },
    appearanceOptionLabel: { color: colors.muted, fontSize: 13, fontWeight: '500' },
    appearanceOptionLabelSelected: { color: colors.ink, fontWeight: '700' },
    appearanceCheck: { color: colors.greenDark, fontSize: 11, fontWeight: '800' },

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
