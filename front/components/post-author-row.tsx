import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';

type Props = {
  alias: string;
  imagenPerfil?: string;
  /** Smaller layout for grid cards on home */
  compact?: boolean;
};

export function PostAuthorRow({ alias, imagenPerfil, compact = false }: Props) {
  const size = compact ? 18 : 36;

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {imagenPerfil ? (
        <Image
          source={{ uri: imagenPerfil }}
          style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.avatarPlaceholder,
            { width: size, height: size, borderRadius: size / 2 },
          ]}>
          <Ionicons name="person" size={compact ? 10 : 18} color="#666" />
        </View>
      )}
      <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1}>
        {alias}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    marginBottom: 4,
  },
  rowCompact: {
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  avatar: {
    backgroundColor: '#e8e8e8',
  },
  avatarPlaceholder: {
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  nameCompact: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0a7ea4',
  },
});
