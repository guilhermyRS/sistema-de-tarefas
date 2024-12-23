// Estrutura de dados
let data = {
  lists: []
};

// Funções de tema
function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  saveThemePreference();
}

function saveThemePreference() {
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function loadThemePreference() {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Funções de modal
function showModal(modalId, data = {}) {
  const modal = document.getElementById(modalId);
  modal.classList.remove('hidden');
  setTimeout(() => modal.classList.add('active'), 10);

  if (modalId === 'newTaskModal') {
    document.getElementById('currentListId').value = data.listId;
  } else if (modalId === 'newSubtaskModal') {
    document.getElementById('currentTaskId').value = data.taskId;
  } else if (modalId === 'newStageModal') {
    document.getElementById('currentSubtaskId').value = data.subtaskId;
  } else if (modalId === 'editModal') {
    document.getElementById('editItemId').value = data.id;
    document.getElementById('editItemType').value = data.type;
    document.getElementById('editItemTitle').value = data.title;
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove('active');
  setTimeout(() => modal.classList.add('hidden'), 300);
}

// Funções de pesquisa
function toggleSearch() {
  const searchBar = document.getElementById('searchBar');
  searchBar.classList.toggle('hidden');
  if (!searchBar.classList.contains('hidden')) {
    searchBar.querySelector('input').focus();
  }
}

function searchTasks(query) {
  query = query.toLowerCase();
  const filteredLists = data.lists.map(list => {
    const filteredTasks = list.tasks.filter(task =>
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.subtasks.some(subtask =>
        subtask.title.toLowerCase().includes(query) ||
        subtask.stages.some(stage =>
          stage.title.toLowerCase().includes(query)
        )
      )
    );
    return { ...list, tasks: filteredTasks };
  }).filter(list =>
    list.title.toLowerCase().includes(query) || list.tasks.length > 0
  );

  renderLists(filteredLists);
}

// CRUD Lista
function createList() {
  const title = document.getElementById('newListTitle').value;
  if (!title) return;

  const newList = {
    id: Date.now(),
    title,
    tasks: []
  };

  data.lists.push(newList);
  saveData();
  renderLists();
  hideModal('newListModal');
  document.getElementById('newListTitle').value = '';
}

function deleteList(listId) {
  if (!confirm('Tem certeza que deseja excluir esta lista?')) return;

  data.lists = data.lists.filter(list => list.id !== listId);
  saveData();
  renderLists();
}

// CRUD Tarefa
function createTask() {
  const listId = parseInt(document.getElementById('currentListId').value);
  const title = document.getElementById('newTaskTitle').value;
  const description = document.getElementById('newTaskDescription').value;
  const priority = document.getElementById('newTaskPriority').value;
  const dueDate = document.getElementById('newTaskDueDate').value;

  if (!title) return;

  const list = data.lists.find(l => l.id === listId);
  const newTask = {
    id: Date.now(),
    title,
    description,
    priority,
    dueDate,
    subtasks: [],
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  list.tasks.push(newTask);
  saveData();
  renderLists();
  hideModal('newTaskModal');
  resetTaskForm();
}

function resetTaskForm() {
  document.getElementById('newTaskTitle').value = '';
  document.getElementById('newTaskDescription').value = '';
  document.getElementById('newTaskPriority').value = 'low';
  document.getElementById('newTaskDueDate').value = '';
}

function deleteTask(listId, taskId) {
  if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

  const list = data.lists.find(l => l.id === listId);
  list.tasks = list.tasks.filter(task => task.id !== taskId);
  saveData();
  renderLists();
}

// Funções de controle de status
function toggleTaskStatus(listId, taskId) {
  const list = data.lists.find(l => l.id === listId);
  const task = list.tasks.find(t => t.id === taskId);
  const newStatus = task.status === 'completed' ? 'pending' : 'completed';
  
  updateTaskStatus(listId, taskId, newStatus);
  renderLists();
}

// CRUD Subtarefa
function createSubtask() {
  const taskId = parseInt(document.getElementById('currentTaskId').value);
  const title = document.getElementById('newSubtaskTitle').value;

  if (!title) return;

  const newSubtask = {
    id: Date.now(),
    title,
    stages: [],
    status: 'pending',
    collapsed: false // Nova propriedade
  };

  data.lists.forEach(list => {
    const task = list.tasks.find(t => t.id === taskId);
    if (task) {
      task.subtasks.push(newSubtask);
    }
  });

  saveData();
  renderLists();
  hideModal('newSubtaskModal');
  document.getElementById('newSubtaskTitle').value = '';
}
function toggleSubtaskCollapse(listId, taskId, subtaskId) {
  const list = data.lists.find(l => l.id === listId);
  const task = list.tasks.find(t => t.id === taskId);
  const subtask = task.subtasks.find(s => s.id === subtaskId);
  subtask.collapsed = !subtask.collapsed;
  saveData();
  renderLists();
}


function deleteSubtask(listId, taskId, subtaskId) {
  if (!confirm('Tem certeza que deseja excluir esta subtarefa?')) return;

  const list = data.lists.find(l => l.id === listId);
  const task = list.tasks.find(t => t.id === taskId);
  task.subtasks = task.subtasks.filter(subtask => subtask.id !== subtaskId);
  saveData();
  renderLists();
}

// Função para verificar e atualizar o status da subtarefa
function updateSubtaskStatus(listId, taskId, subtaskId, forceStatus = null) {
  const list = data.lists.find(l => l.id === listId);
  const task = list.tasks.find(t => t.id === taskId);
  const subtask = task.subtasks.find(s => s.id === subtaskId);
  
  if (forceStatus !== null) {
    subtask.status = forceStatus;
    // Se a subtarefa for marcada como completa, marca todas as etapas
    if (forceStatus === 'completed') {
      subtask.stages.forEach(stage => stage.completed = true);
      subtask.collapsed = true; // Minimiza automaticamente
    } else {
      // Se a subtarefa for desmarcada, desmarca todas as etapas
      subtask.stages.forEach(stage => stage.completed = false);
    }
  } else {
    // Verifica se todas as etapas estão completas
    const allStagesCompleted = subtask.stages.length > 0 && 
                             subtask.stages.every(stage => stage.completed);
    subtask.status = allStagesCompleted ? 'completed' : 'pending';
    
    if (allStagesCompleted) {
      subtask.collapsed = true; // Minimiza automaticamente quando completar
    }
  }
  
  // Atualiza o status da tarefa pai
  updateTaskStatus(listId, taskId);
  saveData();
}

function toggleSubtaskStatus(listId, taskId, subtaskId) {
  const list = data.lists.find(l => l.id === listId);
  const task = list.tasks.find(t => t.id === taskId);
  const subtask = task.subtasks.find(s => s.id === subtaskId);
  const newStatus = subtask.status === 'completed' ? 'pending' : 'completed';
  
  updateSubtaskStatus(listId, taskId, subtaskId, newStatus);
  renderLists();
}

// Atualizar a função toggleStageStatus para colapsar automaticamente quando todas as etapas estiverem concluídas
function toggleStageStatus(listId, taskId, subtaskId, stageId) {
  const list = data.lists.find(l => l.id === listId);
  const task = list.tasks.find(t => t.id === taskId);
  const subtask = task.subtasks.find(s => s.id === subtaskId);
  const stage = subtask.stages.find(st => st.id === stageId);
  
  stage.completed = !stage.completed;
  updateSubtaskStatus(listId, taskId, subtaskId);
  renderLists();
}


function updateTaskStatus(listId, taskId, forceStatus = null) {
  const list = data.lists.find(l => l.id === listId);
  const task = list.tasks.find(t => t.id === taskId);
  
  if (forceStatus !== null) {
    task.status = forceStatus;
    // Se a tarefa for marcada como completa, marca todas as subtarefas e etapas
    if (forceStatus === 'completed') {
      task.subtasks.forEach(subtask => {
        subtask.status = 'completed';
        subtask.stages.forEach(stage => stage.completed = true);
        subtask.collapsed = true; // Minimiza automaticamente
      });
    } else {
      // Se a tarefa for desmarcada, desmarca todas as subtarefas e etapas
      task.subtasks.forEach(subtask => {
        subtask.status = 'pending';
        subtask.stages.forEach(stage => stage.completed = false);
      });
    }
  } else {
    // Verifica se todas as subtarefas estão completas
    const allSubtasksCompleted = task.subtasks.every(subtask => subtask.status === 'completed');
    task.status = allSubtasksCompleted ? 'completed' : 'pending';
  }
  
  saveData();
}

// CRUD Etapa

function createStage() {
    const subtaskId = parseInt(document.getElementById('currentSubtaskId').value);
    const units = parseInt(document.getElementById('stageUnits').value);

    if (!units || units < 1) {
        alert('Por favor, insira uma quantidade válida');
        return;
    }

    // Criar array de etapas baseado na quantidade de unidades
    const stages = [];
    for (let i = 1; i <= units; i++) {
        stages.push({
            id: Date.now() + i,
            title: `${i}`,  // Simplificado para apenas o número
            completed: false,
            unit: i
        });
    }

    // Adicionar as etapas à subtarefa
    data.lists.forEach(list => {
        list.tasks.forEach(task => {
            const subtask = task.subtasks.find(s => s.id === subtaskId);
            if (subtask) {
                subtask.stages = stages;
                subtask.totalUnits = units;
            }
        });
    });

    saveData();
    renderLists();
    hideModal('newStageModal');
    document.getElementById('stageUnits').value = '';
}

function deleteStage(listId, taskId, subtaskId, stageId) {
  if (!confirm('Tem certeza que deseja excluir esta etapa?')) return;

  const list = data.lists.find(l => l.id === listId);
  const task = list.tasks.find(t => t.id === taskId);
  const subtask = task.subtasks.find(s => s.id === subtaskId);
  subtask.stages = subtask.stages.filter(stage => stage.id !== stageId);
  saveData();
  renderLists();
}

// Modificar a função toggleStageStatus para implementar a funcionalidade cascata
function toggleStageStatus(listId, taskId, subtaskId, stageId) {
  const list = data.lists.find(l => l.id === listId);
  const task = list.tasks.find(t => t.id === taskId);
  const subtask = task.subtasks.find(s => s.id === subtaskId);
  const stage = subtask.stages.find(st => st.id === stageId);
  
  // Pegar a unidade atual que foi clicada
  const currentUnit = stage.unit;
  
  // Se marcando como completo, marcar todas as unidades menores
  if (!stage.completed) {
      subtask.stages.forEach(st => {
          if (st.unit <= currentUnit) {
              st.completed = true;
          }
      });
  } else {
      // Se desmarcando, desmarcar todas as unidades maiores
      subtask.stages.forEach(st => {
          if (st.unit >= currentUnit) {
              st.completed = false;
          }
      });
  }
  
  updateSubtaskStatus(listId, taskId, subtaskId);
  saveData();
  renderLists();
}

// Funções de edição
function showEditModal(id, type, title) {
  showModal('editModal', { id, type, title });
}

function saveEdit() {
  const id = parseInt(document.getElementById('editItemId').value);
  const type = document.getElementById('editItemType').value;
  const newTitle = document.getElementById('editItemTitle').value;

  if (!newTitle) return;

  if (type === 'list') {
    const list = data.lists.find(l => l.id === id);
    if (list) list.title = newTitle;
  } else if (type === 'task') {
    data.lists.forEach(list => {
      const task = list.tasks.find(t => t.id === id);
      if (task) task.title = newTitle;
    });
  } else if (type === 'subtask') {
    data.lists.forEach(list => {
      list.tasks.forEach(task => {
        const subtask = task.subtasks.find(s => s.id === id);
        if (subtask) subtask.title = newTitle;
      });
    });
  } else if (type === 'stage') {
    data.lists.forEach(list => {
      list.tasks.forEach(task => {
        task.subtasks.forEach(subtask => {
          const stage = subtask.stages.find(st => st.id === id);
          if (stage) stage.title = newTitle;
        });
      });
    });
  }

  saveData();
  renderLists();
  hideModal('editModal');
}

// Funções de persistência
function saveData() {
  localStorage.setItem('taskManager', JSON.stringify(data));
  updateDashboardStats();
}

function loadData() {
  const saved = localStorage.getItem('taskManager');
  if (saved) {
    data = JSON.parse(saved);
    renderLists();
    updateDashboardStats();
  }
}

// Atualização das estatísticas
function updateDashboardStats() {
  let completed = 0;
  let inProgress = 0;
  let pending = 0;

  data.lists.forEach(list => {
    list.tasks.forEach(task => {
      if (task.status === 'completed') {
        completed++;
        return;
      }

      let hasStartedStages = false;
      let allStagesComplete = true;
      let totalStages = 0;
      let completedStages = 0;

      task.subtasks.forEach(subtask => {
        subtask.stages.forEach(stage => {
          totalStages++;
          if (stage.completed) {
            completedStages++;
            hasStartedStages = true;
          } else {
            allStagesComplete = false;
          }
        });
      });

      if (totalStages === 0) {
        pending++;
      } else if (hasStartedStages && !allStagesComplete) {
        inProgress++;
      } else if (!hasStartedStages) {
        pending++;
      }
    });
  });

  document.getElementById('totalLists').textContent = data.lists.length;
  document.getElementById('completedTasks').textContent = completed;
  document.getElementById('inProgressTasks').textContent = inProgress;
  document.getElementById('pendingTasks').textContent = pending;
}
// Renderização
function renderLists(listsToRender = data.lists) {
  const container = document.getElementById('listsContainer');
  container.innerHTML = listsToRender.map(list => `
      <div class="task-card bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex justify-between items-center">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${list.title}</h3>
                  <div class="flex space-x-2">
                      <button onclick="showEditModal(${list.id}, 'list', '${list.title}')" 
                          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <i class="fas fa-edit"></i>
                      </button>
                      <button onclick="deleteList(${list.id})" 
                          class="text-gray-400 hover:text-red-500">
                          <i class="fas fa-trash"></i>
                      </button>
                  </div>
              </div>
          </div>
          
          <div class="p-4">
              <button onclick="showModal('newTaskModal', {listId: ${list.id}})" 
                  class="w-full px-4 py-2 text-sm text-primary-500 border border-primary-500 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors mb-4">
                  <i class="fas fa-plus mr-2"></i>Adicionar Tarefa
              </button>
              
              <div class="space-y-3">
                  ${list.tasks.map(task => `
                      <div class="task-item border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                          <div class="flex items-start justify-between">
                              <div class="flex items-start space-x-3">
                                  <input type="checkbox" 
                                      class="custom-checkbox mt-1" 
                                      ${task.status === 'completed' ? 'checked' : ''} 
                                      onchange="toggleTaskStatus(${list.id}, ${task.id})">
                                  <div>
                                      <h4 class="text-sm font-medium text-gray-900 dark:text-white ${task.status === 'completed' ? 'line-through text-gray-500' : ''
    }">${task.title}</h4>
                                      ${task.description ? `
                                          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${task.description}</p>
                                      ` : ''}
                                      ${task.dueDate ? `
                                          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                              <i class="far fa-calendar-alt mr-1"></i>
                                              ${new Date(task.dueDate).toLocaleDateString()}
                                          </p>
                                      ` : ''}
                                  </div>
                              </div>
                              <div class="flex space-x-2">
                                  <button onclick="showEditModal(${task.id}, 'task', '${task.title}')" 
                                      class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                      <i class="fas fa-edit"></i>
                                  </button>
                                  <button onclick="deleteTask(${list.id}, ${task.id})" 
                                      class="text-gray-400 hover:text-red-500">
                                      <i class="fas fa-trash"></i>
                                  </button>
                              </div>
                          </div>
                          <div class="mt-2">
                              <button onclick="showModal('newSubtaskModal', {taskId: ${task.id}})" 
                                  class="text-sm text-primary-500 hover:text-primary-600">
                                  <i class="fas fa-plus mr-1"></i>Adicionar Subtarefa
                              </button>
                          </div>
                          ${renderSubtasks(list.id, task)}
                      </div>
                  `).join('')}
              </div>
          </div>
      </div>
  `).join('');
}

function renderSubtasks(listId, task) {
  return `
      <div class="mt-3 space-y-2">
          ${task.subtasks.map(subtask => {
              const totalStages = subtask.stages.length;
              const completedStages = subtask.stages.filter(stage => stage.completed).length;
              const isAllCompleted = totalStages > 0 && completedStages === totalStages;
              
              return `
                  <div class="subtask-item pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                      <div class="flex items-center justify-between">
                          <div class="flex items-center space-x-2">
                              <input type="checkbox" 
                                  class="custom-checkbox" 
                                  ${subtask.status === 'completed' ? 'checked' : ''} 
                                  onchange="toggleSubtaskStatus(${listId}, ${task.id}, ${subtask.id})">
                              <span class="text-sm font-medium ${
                                  subtask.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'
                              }">${subtask.title}</span>
                              ${isAllCompleted ? `
                                  <span class="ml-2 text-xs text-green-500">
                                      <i class="fas fa-check-circle"></i> Concluído
                                  </span>
                              ` : ''}
                          </div>
                          <div class="flex space-x-2 items-center">
                              <button onclick="toggleSubtaskCollapse(${listId}, ${task.id}, ${subtask.id})" 
                                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                  <i class="fas ${subtask.collapsed ? 'fa-chevron-down' : 'fa-chevron-up'}"></i>
                              </button>
                              <button onclick="showEditModal(${subtask.id}, 'subtask', '${subtask.title}')" 
                                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                  <i class="fas fa-edit"></i>
                              </button>
                              <button onclick="deleteSubtask(${listId}, ${task.id}, ${subtask.id})" 
                                  class="text-gray-400 hover:text-red-500">
                                  <i class="fas fa-trash"></i>
                              </button>
                          </div>
                      </div>
                      <div class="mt-2 ${subtask.collapsed ? 'hidden' : ''}">
                          <button onclick="showModal('newStageModal', {subtaskId: ${subtask.id}})" 
                              class="text-xs text-primary-500 hover:text-primary-600">
                              <i class="fas fa-plus mr-1"></i>Adicionar Etapa
                          </button>
                          ${renderStages(listId, task.id, subtask)}
                      </div>
                  </div>
              `;
          }).join('')}
      </div>
  `;
}

// Modificar a função renderStages para exibir verticalmente
function renderStages(listId, taskId, subtask) {
    const totalStages = subtask.stages.length;
    const completedStages = subtask.stages.filter(stage => stage.completed).length;
    const progress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

    let progressClass = 'progress-bar-0';
    let checkboxClass = 'checkbox-0';

    if (progress === 100) {
        progressClass = 'progress-bar-100';
        checkboxClass = 'checkbox-100';
    } else if (progress >= 75) {
        progressClass = 'progress-bar-75';
        checkboxClass = 'checkbox-75';
    } else if (progress >= 50) {
        progressClass = 'progress-bar-50';
        checkboxClass = 'checkbox-50';
    } else if (progress >= 25) {
        progressClass = 'progress-bar-25';
        checkboxClass = 'checkbox-25';
    }

    return `
        <div class="mt-2 space-y-2">
            <div class="flex items-center space-x-2">
                <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div class="${progressClass} h-2.5 rounded-full progress-bar" style="width: ${progress}%"></div>
                </div>
                <span class="text-xs font-semibold ${progress === 100 ? 'text-green-500' : 'text-gray-600 dark:text-gray-400'}">
                    ${progress === 100 ? '<span class="completed-text">Concluído</span>' : `${Math.round(progress)}%`}
                </span>
            </div>
            <div class="flex flex-col space-y-2">
                ${subtask.stages.map(stage => `
                    <div class="stage-item flex items-center space-x-2 p-2 border rounded">
                        <input type="checkbox" 
                            class="custom-checkbox ${checkboxClass}" 
                            ${stage.completed ? 'checked' : ''} 
                            onchange="toggleStageStatus(${listId}, ${taskId}, ${subtask.id}, ${stage.id})">
                        <span class="text-sm ${stage.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}">
                            ${stage.unit}
                        </span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  loadThemePreference();
  loadData();
});

