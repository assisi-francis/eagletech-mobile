import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { CheckCircle2, ShoppingBag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface ToastProps {
  visible: boolean;
  message: string;
  onHide: () => void;
  showViewCart?: boolean;
}

export function Toast({ visible, message, onHide, showViewCart = true }: ToastProps) {
  const router = useRouter();
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      // Trigger light haptic feedback
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback silently if haptics unavailable
      }

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        dismiss();
      }, 2600);
    } else {
      dismiss();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 80,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (visible) onHide();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <CheckCircle2 color="#10b981" size={18} />
        </View>
        <Text style={styles.text} numberOfLines={1}>
          {message}
        </Text>
        {showViewCart && (
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => {
              dismiss();
              router.push('/(tabs)/cart');
            }}
          >
            <ShoppingBag size={14} color="#3b82f6" />
            <Text style={styles.cartBtnText}>Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxWidth: '100%',
  },
  iconCircle: {
    marginRight: 10,
  },
  text: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    marginRight: 12,
  },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    gap: 4,
  },
  cartBtnText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '700',
  },
});
