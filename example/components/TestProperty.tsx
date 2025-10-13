import React from 'react'
import { View, StyleSheet, Text } from 'react-native'

export const TestProperty = ({
  title,
  value,
}: {
  title: string
  value: string
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}:</Text>
      <Text>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    flexDirection: 'row',
  },
  title: {
    marginRight: 8,
    fontWeight: 'bold',
  },
})
