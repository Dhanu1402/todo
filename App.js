import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import TodoScreen from './src/screen/TodoScreen';

export default function App() {
  return (
    <View>
      <SafeAreaView>
        <View>
          <TodoScreen />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({});
