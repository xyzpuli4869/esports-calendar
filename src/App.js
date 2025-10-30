import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Trophy, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

function App() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [selectedGames, setSelectedGames] = useState(['lol', 'csgo', 'valorant']);
  const [selectedLeagues, setSelectedLeagues] = useState([]);
  const [availableLeagues, setAvailableLeagues] = useState({});
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 组件加载时从localStorage读取API密钥
  useEffect(() => {
    const savedApiKey = localStorage.getItem('pandascore_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setApiKeyInput(savedApiKey);
    }
  }, []);

  const GAMES = {
    lol: { name: 'League of Legends', color: 'bg-blue-500' },
    csgo: { name: 'CS2', color: 'bg-orange-500' },
    valorant: { name: 'Valorant', color: 'bg-red-500' }
  };

  const LEAGUE_TRANSLATIONS = {
    // LOL赛事
    'Worlds': '全球总决赛',
    'World Championship': '全球总决赛',
    'MSI': '季中冠军赛',
    'Mid-Season Invitational': '季中冠军赛',
    'LPL': '英雄联盟职业联赛',
    'LCK': '韩国英雄联盟冠军联赛',
    'LCS': '北美英雄联盟冠军联赛',
    'LEC': '欧洲英雄联盟冠军联赛',
    'LLA': '拉丁美洲联赛',
    'CBLOL': '巴西联赛',
    'PCS': '太平洋冠军联赛',
    'VCS': '越南冠军联赛',
    'LJL': '日本联赛',
    'LCO': '大洋洲联赛',
    'LGC Rising': '法国次级联赛',
    'Playoffs': '季后赛',
    'Regular Season': '常规赛',
    'Spring': '春季赛',
    'Summer': '夏季赛',
    'Quarterfinal': '四分之一决赛',
    'Semifinal': '半决赛',
    'Grand final': '总决赛',
    'Final': '决赛',
    
    // CS2赛事
    'Major': 'Major锦标赛',
    'IEM': 'Intel极限大师赛',
    'Intel Extreme Masters': 'Intel极限大师赛',
    'ESL Pro League': 'ESL职业联赛',
    'BLAST': 'BLAST赛事',
    'BLAST Premier': 'BLAST Premier',
    'PGL': 'PGL赛事',
    'CCT': 'CCT锦标赛',
    'ESEA': 'ESEA联赛',
    
    // Valorant赛事
    'VCT': 'Valorant冠军巡回赛',
    'Champions': '冠军赛',
    'Masters': '大师赛',
    'Game Changers': '改变者赛事',
    'Challengers': '挑战者赛事',
    
    // 通用术语
    'Season': '赛季',
    'Split': '阶段',
    'Group Stage': '小组赛',
    'Knockout Stage': '淘汰赛',
    'Upper Bracket': '胜者组',
    'Lower Bracket': '败者组',
    'Closed Qualifier': '封闭预选赛',
    'Open Qualifier': '公开预选赛',
    'Online': '线上赛',
    'Offline': '线下赛'
  };

  const translateLeagueName = (name) => {
    if (!name) return name;
    
    let translated = name;
    
    // 替换所有匹配的英文为中文
    Object.entries(LEAGUE_TRANSLATIONS).forEach(([en, zh]) => {
      const regex = new RegExp(en, 'gi');
      translated = translated.replace(regex, zh);
    });
    
    return translated;
  };

  const fetchMatches = async () => {
    if (!apiKey) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const allMatches = [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 60);
      
      for (const game of selectedGames) {
        // 使用本地API代理（生产环境）或直接调用（开发环境）
        const apiUrl = process.env.NODE_ENV === 'production'
          ? `/api/matches?game=${game}&token=${apiKey}`
          : `https://api.pandascore.co/${game}/matches?per_page=100&token=${apiKey}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        const matchesWithGame = data.map(match => ({
          ...match,
          game: game
        }));
        allMatches.push(...matchesWithGame);
      }
      
      allMatches.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
      setMatches(allMatches);
      
      const leagues = {};
      allMatches.forEach(match => {
        const game = match.game;
        const leagueName = match.league?.name || 'Unknown';
        const serieName = match.serie?.full_name || match.serie?.name;
        const fullName = serieName ? `${leagueName} - ${serieName}` : leagueName;
        const translatedName = translateLeagueName(fullName);
        
        if (!leagues[game]) {
          leagues[game] = new Set();
        }
        leagues[game].add(translatedName);
      });
      
      const leaguesObj = {};
      Object.keys(leagues).forEach(game => {
        leaguesObj[game] = Array.from(leagues[game]).sort();
      });
      
      setAvailableLeagues(leaguesObj);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      fetchMatches();
    }
  }, [apiKey, selectedGames]);

  const handleApiKeySubmit = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput);
      // 保存到localStorage
      localStorage.setItem('pandascore_api_key', apiKeyInput.trim());
    }
  };

  const handleApiKeyLogout = () => {
    setApiKey('');
    setApiKeyInput('');
    localStorage.removeItem('pandascore_api_key');
    setMatches([]);
    setAvailableLeagues({});
  };

  const toggleGame = (game) => {
    setSelectedGames(prev => 
      prev.includes(game) 
        ? prev.filter(g => g !== game)
        : [...prev, game]
    );
  };

  const toggleLeague = (league) => {
    setSelectedLeagues(prev =>
      prev.includes(league)
        ? prev.filter(l => l !== league)
        : [...prev, league]
    );
  };

  const getLeagueName = (match) => {
    const leagueName = match.league?.name || 'Unknown';
    const serieName = match.serie?.full_name || match.serie?.name;
    const tournamentName = match.tournament?.name;
    
    let fullName = '';
    if (serieName) {
      fullName = `${leagueName} - ${serieName}`;
    } else {
      fullName = leagueName;
    }
    
    if (tournamentName && tournamentName !== 'Playoffs') {
      fullName += ` ${tournamentName}`;
    }
    
    return translateLeagueName(fullName);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMatchesForDate = (date) => {
    const dateKey = formatDateKey(date);
    return matches.filter(match => {
      const matchDate = formatDateKey(new Date(match.scheduled_at));
      return matchDate === dateKey;
    });
  };

  const getMatchesGroupedByDate = () => {
    const grouped = {};
    matches.forEach(match => {
      const dateKey = formatDateKey(new Date(match.scheduled_at));
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(match);
    });
    return grouped;
  };

  const filterMatches = () => {
    let filtered = getMatchesForDate(selectedDate);
    
    if (selectedLeagues.length > 0) {
      filtered = filtered.filter(match => {
        const matchLeague = getLeagueName(match);
        return selectedLeagues.includes(matchLeague);
      });
    }
    
    return filtered;
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'running':
        return <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">直播中</span>;
      case 'finished':
        return <span className="bg-gray-500 text-white px-2 py-1 rounded text-xs">已结束</span>;
      case 'not_started':
        return <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">未开始</span>;
      default:
        return null;
    }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const matchesByDate = getMatchesGroupedByDate();
    
    const weeks = [];
    let currentWeek = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = formatDateKey(date);
      const dayMatches = matchesByDate[dateKey] || [];
      
      currentWeek.push({
        date: date,
        day: day,
        matches: dayMatches,
        isToday: formatDateKey(date) === formatDateKey(today),
        isSelected: formatDateKey(date) === formatDateKey(selectedDate)
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  const changeMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const filteredMatches = filterMatches();

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">电竞赛事日历</h1>
          <div>
            <label className="block mb-2 text-sm text-gray-300">
              输入 PandaScore API 密钥
            </label>
            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleApiKeySubmit()}
              className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none mb-4"
              placeholder="your-api-key-here"
            />
            <button
              onClick={handleApiKeySubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-semibold transition"
            >
              开始使用
            </button>
            <p className="text-xs text-gray-400 mt-4 text-center">
              🔒 API密钥将安全保存在本地浏览器中
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500" />
            电竞赛事日历
            <button
              onClick={handleApiKeyLogout}
              className="ml-auto text-sm px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
              title="退出并清除API密钥"
            >
              退出
            </button>
          </h1>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded ${viewMode === 'calendar' ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              日历视图
            </button>
            <button
              onClick={() => {
                setViewMode('today');
                setSelectedDate(new Date());
              }}
              className={`px-4 py-2 rounded ${viewMode === 'today' ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              今日比赛
            </button>
            <button
              onClick={fetchMatches}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded ml-auto"
            >
              刷新数据
            </button>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg mb-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Filter size={16} />
              游戏类型
            </h3>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(GAMES).map(([key, game]) => (
                <button
                  key={key}
                  onClick={() => toggleGame(key)}
                  className={`px-4 py-2 rounded transition ${
                    selectedGames.includes(key)
                      ? game.color + ' text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {game.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">赛事筛选</h3>
            {selectedGames.map(game => (
              availableLeagues[game] && availableLeagues[game].length > 0 && (
                <div key={game} className="mb-3">
                  <h4 className="text-xs text-gray-400 mb-2">{GAMES[game].name}</h4>
                  <div className="flex gap-2 flex-wrap">
                    {availableLeagues[game].map(league => (
                      <button
                        key={league}
                        onClick={() => toggleLeague(league)}
                        className={`px-3 py-1 text-sm rounded transition ${
                          selectedLeagues.includes(league)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {league}
                      </button>
                    ))}
                  </div>
                </div>
              )
            ))}
            {selectedLeagues.length > 0 && (
              <button
                onClick={() => setSelectedLeagues([])}
                className="text-xs text-red-400 hover:text-red-300 mt-2"
              >
                清除赛事筛选
              </button>
            )}
          </div>
        </header>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">加载比赛数据中...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 text-center">
            <p className="text-red-400">错误: {error}</p>
            <button
              onClick={fetchMatches}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
            >
              重试
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'calendar' && (
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="p-2 hover:bg-gray-700 rounded"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-xl font-bold">
                    {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                  </h2>
                  <button
                    onClick={() => changeMonth(1)}
                    className="p-2 hover:bg-gray-700 rounded"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                    <div key={day} className="text-center text-gray-400 text-sm py-2">
                      {day}
                    </div>
                  ))}
                  
                  {renderCalendar().map((week, weekIndex) => (
                    week.map((cell, cellIndex) => (
                      <div
                        key={`${weekIndex}-${cellIndex}`}
                        onClick={() => cell && setSelectedDate(cell.date)}
                        className={`min-h-24 p-2 rounded cursor-pointer border transition ${
                          cell
                            ? cell.isSelected
                              ? 'bg-blue-900 border-blue-500'
                              : cell.isToday
                              ? 'bg-gray-700 border-yellow-500'
                              : 'bg-gray-750 border-gray-700 hover:bg-gray-700'
                            : 'bg-gray-900 border-gray-800'
                        }`}
                      >
                        {cell && (
                          <>
                            <div className="font-semibold mb-1">{cell.day}</div>
                            {cell.matches.slice(0, 2).map((match, idx) => (
                              <div
                                key={idx}
                                className={`text-xs px-1 py-0.5 rounded mb-1 truncate ${GAMES[match.game].color}`}
                              >
                                {match.opponents?.[0]?.opponent?.acronym || 'TBD'} vs {match.opponents?.[1]?.opponent?.acronym || 'TBD'}
                              </div>
                            ))}
                            {cell.matches.length > 2 && (
                              <div className="text-xs text-gray-400">+{cell.matches.length - 2} 场</div>
                            )}
                          </>
                        )}
                      </div>
                    ))
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">
                {selectedDate.toLocaleDateString('zh-CN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })} 的比赛 ({filteredMatches.length})
              </h2>
              
              {filteredMatches.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                  <p>这天没有比赛</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMatches.map(match => (
                    <div
                      key={match.id}
                      className="bg-gray-750 rounded-lg p-4 hover:bg-gray-700 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`${GAMES[match.game].color} px-2 py-1 rounded text-xs font-semibold`}>
                            {GAMES[match.game].name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {translateLeagueName(getLeagueName(match))}
                          </span>
                          {getStatusBadge(match.status)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-300">
                          <Clock size={16} />
                          {formatDate(match.scheduled_at)}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 flex-1">
                          <div className="flex-1 flex items-center justify-end gap-3">
                            {match.opponents?.[0]?.opponent?.image_url && (
                              <img 
                                src={match.opponents[0].opponent.image_url} 
                                alt={match.opponents[0].opponent.name}
                                className="w-10 h-10 object-contain"
                              />
                            )}
                            <div className="text-right">
                              <div className="font-semibold">
                                {match.opponents?.[0]?.opponent?.name || 'TBD'}
                              </div>
                              <div className="text-xs text-gray-400">
                                {match.opponents?.[0]?.opponent?.acronym || ''}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {match.results && match.results.length > 0 && (
                              <div className="text-2xl font-bold">
                                {match.results[0]?.score || 0}
                              </div>
                            )}
                            <div className="text-gray-500 font-bold">VS</div>
                            {match.results && match.results.length > 1 && (
                              <div className="text-2xl font-bold">
                                {match.results[1]?.score || 0}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 flex items-center gap-3">
                            <div>
                              <div className="font-semibold">
                                {match.opponents?.[1]?.opponent?.name || 'TBD'}
                              </div>
                              <div className="text-xs text-gray-400">
                                {match.opponents?.[1]?.opponent?.acronym || ''}
                              </div>
                            </div>
                            {match.opponents?.[1]?.opponent?.image_url && (
                              <img 
                                src={match.opponents[1].opponent.image_url} 
                                alt={match.opponents[1].opponent.name}
                                className="w-10 h-10 object-contain"
                              />
                            )}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-400 ml-4">
                          {match.match_type === 'best_of' ? `BO${match.number_of_games}` : match.match_type}
                        </div>
                      </div>
                      
                      {match.streams_list && match.streams_list.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="flex gap-2 flex-wrap">
                            {match.streams_list.slice(0, 3).map((stream, idx) => (
                              <a
                                key={idx}
                                href={stream.raw_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded"
                              >
                                📺 {stream.language.toUpperCase()} {stream.official && '(官方)'}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;