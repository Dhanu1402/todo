import React, { useState, useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { IconButton, Checkbox } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import Fallback from '../components/Fallback';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,

    shouldPlaySound: true,

    shouldSetBadge: false,
  }),
});

const TodoScreen = () => {
  const [todo, setTodo] = useState('');

  const [date, setDate] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [showTimePicker, setShowTimePicker] = useState(false);

  const [todoList, setTodoList] = useState([]);

  const [editedTodo, setEditedTodo] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      const updatedTodos = todoList.map((item) => {
        if (!item.completed && new Date(item.date) < now) {
          return { ...item, completed: true };
        }

        return item;
      });
      setTodoList(updatedTodos);

      saveTodos(updatedTodos);
    }, 20000);

    return () => clearInterval(interval);
  }, [todoList]);

  useEffect(() => {
    const requestPermissions = async () => {
      await Notifications.requestPermissionsAsync();
    };

    requestPermissions();

    loadTodos();
  }, []);

  const handleAddTodo = async () => {
    if (todo === '') {
      return;
    }

    const newTodo = {
      id: Date.now().toString(),
      title: todo,
      completed: false,
      date: date.toISOString(),
    };

    const notificationId = await scheduleNotification(newTodo);
    newTodo.notificationId = notificationId;

    const updatedTodoList = [...todoList, newTodo];

    setTodoList(updatedTodoList);

    setTodo('');

    setDate(new Date());

    await saveTodos(updatedTodoList);
  };

  const saveTodos = async (todos) => {
    try {
      const todoz = todos.map((todo) => ({
        ...todo,
        date: new Date(todo.date).toISOString(),
      }));

      await AsyncStorage.setItem('todoList', JSON.stringify(todoz));
    } catch (error) {
      console.error('Failed to save todos.', error);
    }
  };

  const loadTodos = async () => {
    try {
      const storedTodos = await AsyncStorage.getItem('todoList');

      if (storedTodos) {
        const parsedTodos = JSON.parse(storedTodos).map((todo) => ({
          ...todo,
          date: new Date(todo.date),
        }));

        setTodoList(parsedTodos);
      }
    } catch (error) {
      console.error('Failed to load todos.', error);
    }
  };

  const handleDeleteTodo = async (id) => {
    const todoToDelete = todoList.find((todo) => todo.id === id);

    if (todoToDelete && todoToDelete.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(
        todoToDelete.notificationId
      );

      await Notifications.dismissNotificationAsync(todoToDelete.notificationId);
    }

    const updatedList = todoList.filter((todo) => todo.id !== id);

    setTodoList(updatedList);

    await saveTodos(updatedList);
  };

  const handleEditTodo = (todo) => {
    setEditedTodo(todo);

    setTodo(todo.title);

    setDate(new Date(todo.date));
  };

  const handleUpdateTodo = async () => {
    const updatedTodos = todoList.map((item) => {
      if (item.id === editedTodo.id) {
        return { ...item, title: todo, date: date.toISOString() };
      }

      return item;
    });

    setTodoList(updatedTodos);

    setEditedTodo(null);

    setTodo('');

    setDate(new Date());

    await saveTodos(updatedTodos);

    await scheduleNotification(editedTodo);
  };

  const handleCompleteTodo = async (id) => {
    const updatedTodos = todoList.map((item) => {
      if (item.id === id) {
        return { ...item, completed: true };
      }

      return item;
    });

    setTodoList(updatedTodos);

    await saveTodos(updatedTodos);
  };

  const scheduleNotification = async (todo) => {
    const trigger = new Date(todo.date);
    trigger.setSeconds(0);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Reminder',
        body: `Your task "${todo.title}" is completed.`,
      },

      trigger,
    });

    return notificationId;
  };

  const renderTodos = ({ item }) => {
    return (
      <View style={styles.container1}>
        <Checkbox
          status={item.completed ? 'checked' : 'unchecked'}
          onPress={() => {
            if (!item.completed) {
              handleCompleteTodo(item.id);
            }
          }}
        />

        <Text
          style={[
            styles.content,
            {
              flex: 1,
              textDecorationLine: item.completed ? 'line-through' : 'none',
            },
          ]}
        >
          {item.title}
        </Text>

        <Text style={{ color: '#fff' }}>
          {new Date(item.date).toLocaleDateString()}{' '}
          {new Date(item.date).toLocaleTimeString()}
        </Text>

        {item.completed ? (
          <IconButton
            icon="trash-can"
            iconColor="#fff"
            onPress={() => handleDeleteTodo(item.id)}
          />
        ) : (
          <>
            <IconButton
              icon="pencil"
              iconColor="#fff"
              onPress={() => handleEditTodo(item)}
            />

            <IconButton
              icon="trash-can"
              iconColor="#fff"
              onPress={() => handleDeleteTodo(item.id)}
            />
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.in}
        placeholder="Add a task"
        value={todo}
        onChangeText={(text) => setTodo(text)}
      />

      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateButton}>
          Select Date: {date.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDate(selectedDate);
              setShowTimePicker(true);
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              const currentDate = date;
              currentDate.setHours(selectedTime.getHours());
              currentDate.setMinutes(selectedTime.getMinutes());
              setDate(currentDate);
            }
          }}
        />
      )}

      {editedTodo ? (
        <TouchableOpacity style={styles.btn} onPress={handleUpdateTodo}>
          <Text style={styles.content}>Save</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.btn} onPress={handleAddTodo}>
          <Text style={styles.content}>Add</Text>
        </TouchableOpacity>
      )}

      <FlatList data={todoList} renderItem={renderTodos} />

      {todoList.length <= 0 && <Fallback />}
    </View>
  );
};

export default TodoScreen;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 60,
  },

  container1: {
    backgroundColor: '#1e90ff',
    borderRadius: 6,
    paddingHorizontal: 6,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },

  in: {
    borderWidth: 2,
    borderColor: '#1e90ff',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  btn: {
    backgroundColor: '#000',
    borderRadius: 6,
    paddingVertical: 8,
    marginVertical: 34,
    alignItems: 'center',
  },

  content: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },

  dateButton: {
    color: '#1e90ff',
    fontWeight: 'bold',
    fontSize: 16,
    marginVertical: 8,
  },
});
