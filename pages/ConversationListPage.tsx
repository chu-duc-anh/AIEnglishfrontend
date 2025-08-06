import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, PlusCircle, ChevronRight, Trash2, Loader, Utensils, Briefcase } from 'lucide-react';
import { getConversations, deleteConversation } from '../services/conversationService';
import type { Conversation, User } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';

interface ConversationListPageProps {
  currentUser: User;
}

const scenarioDetails: { [key: string]: { icon: React.FC<any>, name: string, color: string, darkColor: string } } = {
  freestyle: { icon: MessageSquare, name: 'Freestyle', color: 'text-indigo-600', darkColor: 'dark:text-indigo-400' },
  restaurant: { icon: Utensils, name: 'Restaurant', color: 'text-green-600', darkColor: 'dark:text-green-400' },
  interview: { icon: Briefcase, name: 'Interview', color: 'text-purple-600', darkColor: 'dark:text-purple-400' },
};


const ConversationListPage: React.FC<ConversationListPageProps> = ({ currentUser }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const userConversations = await getConversations();
        setConversations(userConversations);
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [currentUser.id]);

  const handleDeleteClick = (e: React.MouseEvent, convoId: string, convoTitle: string) => {
    // Prevent navigating to the chat when clicking the delete button
    e.preventDefault();
    e.stopPropagation();

    setConversationToDelete({ id: convoId, title: convoTitle });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (conversationToDelete) {
      try {
        await deleteConversation(conversationToDelete.id);
        setConversations(prevConversations => prevConversations.filter(c => c.id !== conversationToDelete.id));
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      } finally {
        setIsConfirmModalOpen(false);
        setConversationToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setConversationToDelete(null);
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-6 sm:p-8 flex flex-col h-[calc(100vh-80px)]">
        <div className="flex justify-between items-center mb-8 flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Your Conversations</h1>
          <Link
            to="/setup"
            className="inline-flex items-center bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            New Conversation
          </Link>
        </div>

        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
                <div className="text-center p-12">
                    <Loader className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">Loading Conversations...</h3>
                </div>
            </div>
          ) : conversations.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {conversations.map((convo) => {
                const scenarioInfo = scenarioDetails[convo.scenario] || scenarioDetails.freestyle;
                const Icon = scenarioInfo.icon;
                return (
                  <li key={convo.id}>
                    <Link to={`/chat/${convo.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                      <div className="p-6">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 bg-indigo-50 dark:bg-gray-700 p-3 rounded-full mr-4`}>
                            <Icon className={`h-6 w-6 ${scenarioInfo.color} ${scenarioInfo.darkColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate" title={convo.title}>{convo.title}</p>
                               <span className="text-xs font-medium px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full">{scenarioInfo.name}</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Last active: {new Date(convo.updatedAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center ml-4">
                            <button
                              onClick={(e) => handleDeleteClick(e, convo.id, convo.title)}
                              className="text-gray-500 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100 dark:hover:bg-red-500/20 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              aria-label={`Delete conversation: ${convo.title}`}
                            >
                              <Trash2 size={18} />
                            </button>
                            <div className="text-gray-400 group-hover:translate-x-1 transition-transform">
                                <ChevronRight className="h-6 w-6" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
                <div className="text-center p-12">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No conversations yet</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Get started by creating a new conversation.</p>
                </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the conversation "${conversationToDelete?.title}"? This action cannot be undone.`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        confirmButtonVariant="danger"
      />
    </>
  );
};

export default ConversationListPage;
