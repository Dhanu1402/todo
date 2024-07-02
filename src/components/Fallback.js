import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

const Fallback = () => {
  return (
    <View style={styles.container}>
      <Text>No Todos Remaining! Please add one!</Text>
    </View>
  );
};

export default Fallback;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
