import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Text,
  Alert,
  Animated,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = SCREEN_WIDTH - 60;

interface Point {
  x: number;
  y: number;
}

interface HandwritingCanvasProps {
  onRecognize: (svgString: string) => void;
  isRecognizing?: boolean;
}

export const HandwritingCanvas: React.FC<HandwritingCanvasProps> = ({ 
  onRecognize, 
  isRecognizing = false 
}) => {
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const canvasRef = useRef<View>(null);
  
  // 动画
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  const clearCanvas = useCallback(() => {
    setStrokes([]);
    setCurrentStroke([]);
    // 淡入效果
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentStroke([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentStroke((prev) => [...prev, { x: locationX, y: locationY }]);
      },
      onPanResponderRelease: () => {
        setStrokes((prev) => [...prev, currentStroke]);
        setCurrentStroke([]);
      },
    }),
  ).current;

  // 生成SVG字符串
  const generateSvgString = (): string => {
    let pathD = '';
    const allStrokes = [...strokes, currentStroke];
    
    allStrokes.forEach((stroke) => {
      if (stroke.length > 0) {
        pathD += `M ${stroke[0].x} ${stroke[0].y} `;
        stroke.slice(1).forEach((point) => {
          pathD += `L ${point.x} ${point.y} `;
        });
      }
    });

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">
  <rect width="100%" height="100%" fill="white"/>
  <path d="${pathD}" stroke="black" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
    
    return svgString;
  };

  const handleRecognize = () => {
    if (strokes.length === 0 && currentStroke.length === 0) {
      Alert.alert('提示', '请先写一个字');
      return;
    }
    const svgString = generateSvgString();
    onRecognize(svgString);
  };

  // 渲染笔画路径 - 使用点连线方式
  const renderStrokes = () => {
    const allStrokes = [...strokes, currentStroke];
    
    return allStrokes.map((stroke, strokeIndex) => {
      if (stroke.length < 2) return null;
      
      const isCurrent = strokeIndex === allStrokes.length - 1 && currentStroke.length > 0;
      const strokeColor = isCurrent ? '#FFD700' : '#1a1a2e';
      
      // 使用多个小线段来模拟笔画
      return stroke.slice(1).map((point, pointIndex) => {
        const prevPoint = stroke[pointIndex];
        const dx = point.x - prevPoint.x;
        const dy = point.y - prevPoint.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        return (
          <View
            key={`${strokeIndex}-${pointIndex}`}
            style={[
              styles.line,
              {
                left: prevPoint.x,
                top: prevPoint.y,
                width: length,
                transform: [{ rotate: `${angle}deg` }],
                backgroundColor: strokeColor,
              },
            ]}
          />
        );
      });
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.canvasContainer} ref={canvasRef} {...panResponder.panHandlers}>
        <View style={styles.canvas}>
          {renderStrokes()}
        </View>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={clearCanvas}
          activeOpacity={0.7}
        >
          <Text style={styles.clearButtonText}>🗑️ 清空</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.recognizeButton, 
            isRecognizing && styles.recognizeButtonDisabled
          ]}
          onPress={handleRecognize}
          disabled={isRecognizing}
          activeOpacity={0.7}
        >
          <Text style={styles.recognizeButtonText}>
            {isRecognizing ? '🔍 识别中...' : '✨ 开始识别'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  canvasContainer: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  canvas: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  line: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    transformOrigin: 'left center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 16,
  },
  clearButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a5e',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recognizeButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: '#FFD700',
    borderRadius: 12,
  },
  recognizeButtonDisabled: {
    backgroundColor: '#999',
  },
  recognizeButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HandwritingCanvas;
