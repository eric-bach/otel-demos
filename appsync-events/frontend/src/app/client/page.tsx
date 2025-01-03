'use client';

import { useEffect,  useState } from 'react';
import { events } from 'aws-amplify/data';

const Client = () => {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    async function handleConnect() {
      return (await events.connect('/flights/channel'))
        .subscribe({
          next: (data) => {
            console.log('Received data:', data);
            setMessages((prevMessages) => [...prevMessages, JSON.stringify(data)]);
          },
          error: (error) => {
            console.error('Subscription error:', error);
          }
        });
    }

    handleConnect() 
  }, []);

  return (
    <div>
      <h2>Received Messages:</h2>
      <ul>
        {messages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>
    </div>
  );
};

export default Client;