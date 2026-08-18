import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sendMessage, getChatHistory } from '@/api/chat';

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: string; message: string }) => sendMessage(sessionId, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'history', variables.sessionId] });
    },
  });
};

export const useChatHistory = (sessionId: string) => {
  return useQuery({
    queryKey: ['chat', 'history', sessionId],
    queryFn: () => getChatHistory(sessionId),
    enabled: !!sessionId,
  });
};
