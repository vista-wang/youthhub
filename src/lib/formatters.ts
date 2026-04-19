export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString).getTime();
  const now = Date.now();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "刚刚";

  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}周前`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}个月前`;

  const years = Math.floor(days / 365);
  return `${years}年前`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
