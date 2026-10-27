import { Text, View } from 'react-native';

import { MaterialIcon } from '../../components/MaterialIcon';
import { Button, Card } from '../../components/ui';
import { useColors, useThemeStyles } from '../../lib/theme';
import { createStyles } from './styles';
import type { AnnouncementRecord } from './types';
import { Input, ScreenTitle, SectionHeading } from './ui';

export function UpdatesTab({
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
