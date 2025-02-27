import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../lib/context/ToastContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { formatDate } from '../../lib/helpers/dateFormat';

const UsersList = () => {
  const { isAdmin } = useAuth();
  const { success, error: showError } = useToast();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userToPromote, setUserToPromote] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'admin', 'user'

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Get auth users from auth.users
        let { data: authUsers, error: authError } = await supabase
          .from('auth.users')
          .select('id, email, email_confirmed_at, created_at, last_sign_in_at')
          .order('created_at', { ascending: false });
          
        if (authError) throw authError;
        
        // Get app users from public.users to check admin status
        const { data: appUsers, error: appError } = await supabase
          .from('users')
          .select('id, is_admin, created_at');
          
        if (appError) throw appError;
        
        // Merge the data
        const mergedUsers = authUsers.map(authUser => {
          const appUser = appUsers.find(u => u.id === authUser.id) || { is_admin: false };
          return {
            ...authUser,
            is_admin: appUser.is_admin,
            app_created_at: appUser.created_at
          };
        });
        
        setUsers(mergedUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err.message);
        showError('Erro ao carregar lista de usuários');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, showError]);

  // Filter and search users
  const filteredUsers = users.filter(user => {
    // Apply role filter
    if (filter === 'admin' && !user.is_admin) return false;
    if (filter === 'user' && user.is_admin) return false;
    
    // Apply search filter
    if (searchTerm) {
      return user.email.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    return true;
  });

  // Promote user to admin
  const promoteUser = async () => {
    if (!userToPromote) return;
    
    setActionLoading(true);
    
    try {
      const { error: promoteError } = await supabase.rpc('make_admin', { user_id: userToPromote.id });
      
      if (promoteError) throw promoteError;
      
      // Update local state
      setUsers(users.map(u => 
        u.id === userToPromote.id ? { ...u, is_admin: true } : u
      ));
      
      success(`Usuário ${userToPromote.email} promovido a administrador`);
    } catch (err) {
      console.error('Error promoting user:', err);
      showError('Erro ao promover usuário a administrador');
    } finally {
      setActionLoading(false);
      setShowPromoteModal(false);
      setUserToPromote(null);
    }
  };

  // Delete user (In a real app, this would involve more cleanup)
  const deleteUser = async () => {
    if (!userToDelete) return;
    
    setActionLoading(true);
    
    try {
      // Delete user from auth.users
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userToDelete.id);
      
      if (deleteError) throw deleteError;
      
      // Update local state
      setUsers(users.filter(u => u.id !== userToDelete.id));
      
      success(`Usuário ${userToDelete.email} excluído com sucesso`);
    } catch (err) {
      console.error('Error deleting user:', err);
      showError('Erro ao excluir usuário');
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  // Check if user is admin
  if (!isAdmin) {
    return (
      <div className="p-4 text-center">
        <p className="text-error">Acesso negado. Você precisa ser um administrador para acessar esta página.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/10 border-t-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/10 border border-error/20 text-error rounded-md p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-background-card rounded-lg border border-background-light/20 overflow-hidden">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Gerenciar Usuários</h1>
        
        {/* Filters and search */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <label htmlFor="filter" className="text-sm text-text-secondary">Filtrar por:</label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-md border border-background-light bg-background p-2 text-sm text-white focus:ring-2 focus:ring-primary"
            >
              <option value="all">Todos</option>
              <option value="admin">Administradores</option>
              <option value="user">Usuários</option>
            </select>
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 rounded-md border border-background-light bg-background p-2 pl-8 text-white focus:ring-2 focus:ring-primary"
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 absolute top-3 left-2 text-text-secondary" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {/* Users table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-background-light">
            <thead className="bg-background-dark">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Cadastro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Último Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-background-card divide-y divide-background-light">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-background-dark/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`h-2.5 w-2.5 rounded-full ${user.email_confirmed_at ? 'bg-success' : 'bg-warning'} mr-2`}></span>
                        {user.is_admin && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/20 text-primary">
                            Admin
                          </span>
                        )}
                        {!user.email_confirmed_at && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-warning/20 text-warning">
                            Não verificado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {!user.is_admin && (
                        <button
                          onClick={() => {
                            setUserToPromote(user);
                            setShowPromoteModal(true);
                          }}
                          className="text-primary hover:text-primary-light"
                        >
                          Promover a Admin
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setUserToDelete(user);
                          setShowDeleteModal(true);
                        }}
                        className="text-error hover:text-error-light"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-text-secondary">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promote user modal */}
      <Modal
        isOpen={showPromoteModal}
        onClose={() => setShowPromoteModal(false)}
        title="Promover a Administrador"
        size="sm"
      >
        <div className="py-4">
          <p className="mb-6">
            Tem certeza que deseja promover <span className="font-semibold">{userToPromote?.email}</span> a administrador? 
            Esta ação concederá permissões administrativas completas a este usuário.
          </p>
          
          <div className="flex justify-end gap-4">
            <Button
              variant="dark"
              onClick={() => setShowPromoteModal(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            
            <Button
              variant="primary"
              onClick={promoteUser}
              isLoading={actionLoading}
            >
              Promover
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete user modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Excluir Usuário"
        size="sm"
      >
        <div className="py-4">
          <p className="mb-6">
            Tem certeza que deseja excluir o usuário <span className="font-semibold">{userToDelete?.email}</span>?
            Esta ação é irreversível e todos os dados do usuário serão perdidos.
          </p>
          
          <div className="flex justify-end gap-4">
            <Button
              variant="dark"
              onClick={() => setShowDeleteModal(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            
            <Button
              variant="danger"
              onClick={deleteUser}
              isLoading={actionLoading}
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersList;