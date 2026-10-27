import { Text, View } from 'react-native';

import { Card } from '../../components/ui';
import { useThemeStyles } from '../../lib/theme';
import { sampleAnnouncements } from './data';
import { createStyles } from './styles';

export function AnnouncementsScreen() {
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
