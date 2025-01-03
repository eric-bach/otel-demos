'use client';

import { useState } from "react";
import { events } from "aws-amplify/data";

const PublishButton = () => {
  const [data, setData] = useState("");

  const handlePublish = async () => {
    await events.post(
      "/flights/channel", 
      { 
        data: data 
      }
    );
  };

  return (
    <form>
      <input 
        type="text" 
        name="data"
        value={data}
        onChange={(e) => setData(e.target.value)}
        className='border border-gray-300 rounded p-2'
      />
      <button 
        type="button" 
        onClick={handlePublish}  
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Publish
      </button>
    </form>
  );
};

export default PublishButton;