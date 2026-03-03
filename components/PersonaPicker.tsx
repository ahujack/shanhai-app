import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { PersonaProfile } from '../src/types/persona';
import theme from '../src/constants/Colors';

interface PersonaPickerProps {
  personas: PersonaProfile[];
  active: PersonaProfile;
  onSelect: (persona: PersonaProfile) => void;
  onClose: () => void;
}

export default function PersonaPicker({
  personas,
  active,
  onSelect,
  onClose,
}: PersonaPickerProps) {
  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.container}>
          <Text style={styles.title}>🎭 选择你的灵伴</Text>
          <Text style={styles.subtitle}>不同角色会带来不同的解读风格</Text>
          
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {personas.map((persona) => (
              <TouchableOpacity
                key={persona.id}
                style={[
                  styles.personaItem,
                  active.id === persona.id && styles.personaItemActive,
                ]}
                onPress={() => onSelect(persona)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: persona.image }}
                  style={styles.personaImage}
                />
                <View style={styles.personaInfo}>
                  <Text style={styles.personaName}>{persona.name}</Text>
                  <Text style={styles.personaTitle}>{persona.title}</Text>
                  <View style={styles.tagContainer}>
                    {persona.toneTags.map((tag) => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                {active.id === persona.id && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>关闭</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1B1427',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F8D05F',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#B2B4C8',
    textAlign: 'center',
    marginBottom: 20,
  },
  list: {
    maxHeight: 400,
  },
  personaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2B2342',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  personaItemActive: {
    borderColor: '#F8D05F',
    backgroundColor: '#2B1F3C',
  },
  personaImage: {
    width: 60,
    height: 60,
    borderRadius: 16,
  },
  personaInfo: {
    flex: 1,
    marginLeft: 12,
  },
  personaName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  personaTitle: {
    fontSize: 13,
    color: '#B2B4C8',
    marginTop: 2,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  tag: {
    backgroundColor: '#3D3255',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  tagText: {
    fontSize: 11,
    color: '#F8D05F',
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8D05F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#1B1427',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#3D3255',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
