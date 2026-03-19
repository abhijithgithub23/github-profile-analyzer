// Keeping heavy logic out of components
export const formatNumber = (num) => {
  if (!num) return 0;
  return num > 999 ? (num/1000).toFixed(1) + 'k' : num;
};


// 🧠 NEW: Repository Filtering Engine
export const getFilteredRepos = (repos, filterLanguage, sortType) => {
  if (!repos || repos.length === 0) return [];
  
  // 1. Apply Language Filter
  let result = repos;
  if (filterLanguage !== 'All') {
    result = result.filter(r => r.language === filterLanguage);
  }
  
  // 2. Apply Sorting
  // We clone the array because Array.prototype.sort mutates in place
  result = [...result]; 
  
  switch (sortType) {
    case 'Stars':
      result.sort((a, b) => b.stargazers_count - a.stargazers_count);
      break;
    case 'Forks':
      result.sort((a, b) => b.forks_count - a.forks_count);
      break;
    case 'Size':
      result.sort((a, b) => b.size - a.size);
      break;
    case 'Recent':
    default:
      // The GitHub API already returns them sorted by 'pushed', but we enforce it here
      result.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
      break;
  }
  
  return result;
};
