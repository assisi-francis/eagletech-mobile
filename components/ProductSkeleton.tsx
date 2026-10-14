import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 36) / 2;

export function ProductSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5, 6].map((key) => (
        <View key={key} style={styles.card}>
          <Animated.View style={[styles.imagePlaceholder, { opacity: pulseAnim }]} />
          <View style={styles.details}>
            <Animated.View style={[styles.badgePlaceholder, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.titlePlaceholder, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.subtitlePlaceholder, { opacity: pulseAnim }]} />
            <View style={styles.footerRow}>
              <Animated.View style={[styles.pricePlaceholder, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.buttonPlaceholder, { opacity: pulseAnim }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  card: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  details: {
    paddingTop: 10,
  },
  badgePlaceholder: {
    width: 50,
    height: 14,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
    marginBottom: 8,
  },
  titlePlaceholder: {
    width: '90%',
    height: 14,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
    marginBottom: 6,
  },
  subtitlePlaceholder: {
    width: '60%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  pricePlaceholder: {
    width: 70,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  buttonPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
});
