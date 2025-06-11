'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Post {
  text: string;
  createdAt: string;
  uri: string;
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts/dril');
      
      if (response.status === 401) {
        // Not authenticated, redirect to login
        router.push('/login');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch posts');
      }

      setPosts(data.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-center">
          <div className="text-lg mb-4">Error: {error}</div>
          <button
            onClick={fetchPosts}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            dril.bsky.social Posts
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">
            Latest 20 Posts
          </h2>
          <button
            onClick={fetchPosts}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No posts found
          </div>
        ) : (
          <ul className="space-y-4">
            {posts.map((post, index) => (
              <li
                key={post.uri || index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="text-gray-900 whitespace-pre-wrap">
                  {post.text}
                </div>
                <div className="text-sm text-gray-500 mt-3">
                  {new Date(post.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}