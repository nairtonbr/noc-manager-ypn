import { AuthProvider, useAuth } from './AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Server, 
  Globe, 
  Network, 
  Map, 
  Users, 
  Database, 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Terminal,
  Copy,
  HelpCircle,
  LogOut,
  Trash2,
  Edit2,
  Package,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  Calendar,
  Phone,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, setDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

function Dashboard() {
  const { user, role, logout } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [datacenters, setDatacenters] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("assets");

  const isAdmin = role === 'admin';

  const onWhatsAppNotification = async (message: string, targetPhone?: string) => {
    if (!settings || !settings.evolutionWebUrl || !settings.evolutionWebApiKey || !settings.evolutionWebInstance) {
      return;
    }

    const phone = targetPhone || settings.notificationPhone;
    if (!phone) return;

    try {
      await fetch(`${settings.evolutionWebUrl}/message/sendText/${settings.evolutionWebInstance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': settings.evolutionWebApiKey
        },
        body: JSON.stringify({
          number: phone.replace(/\D/g, ''),
          text: message,
          delay: 1200
        })
      });
    } catch (error) {
      console.error("Error sending WhatsApp notification:", error);
    }
  };

  // Real-time listeners
  useEffect(() => {
    if (!user || role === 'pending' || role === null) return;

    const qAssets = query(collection(db, 'assets'), orderBy('updatedAt', 'desc'));
    const unsubAssets = onSnapshot(qAssets, (snapshot) => {
      setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'assets'));

    const qTickets = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsubTickets = onSnapshot(qTickets, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tickets'));

    const qDC = query(collection(db, 'datacenters'), orderBy('name', 'asc'));
    const unsubDC = onSnapshot(qDC, (snapshot) => {
      setDatacenters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'datacenters'));

    const qStock = query(collection(db, 'stock'), orderBy('name', 'asc'));
    const unsubStock = onSnapshot(qStock, (snapshot) => {
      setStock(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'stock'));

    const qTasks = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tasks'));

    const qCustomers = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const unsubCustomers = onSnapshot(qCustomers, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'customers'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings({ id: docSnap.id, ...docSnap.data() });
      } else {
        setSettings(null);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/global'));

    let unsubUsers = () => {};
    if (isAdmin) {
      const qUsers = query(collection(db, 'users'), orderBy('email', 'asc'));
      unsubUsers = onSnapshot(qUsers, (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));
    }

    return () => {
      unsubAssets();
      unsubTickets();
      unsubDC();
      unsubStock();
      unsubTasks();
      unsubCustomers();
      unsubSettings();
      unsubUsers();
    };
  }, [user, role, isAdmin]);

  if (role === 'pending') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 text-center font-sans">
        <div className="w-20 h-20 bg-[#00ff88]/10 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-[#00ff88] animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Acesso Pendente</h1>
        <p className="text-gray-400 max-w-md mb-8">
          Seu acesso ainda não foi liberado. Por favor, solicite ao NOC a liberação ao sistema.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Seu E-mail</p>
            <p className="text-sm font-mono">{user?.email}</p>
          </div>
          <Button variant="ghost" onClick={logout} className="text-gray-400 hover:text-white">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </div>
    );
  }

  const filteredAssets = assets.filter(asset => 
    asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [
    { id: 'Servers', icon: <Server className="w-4 h-4" />, label: 'Servers' },
    { id: 'Web Applications', icon: <Globe className="w-4 h-4" />, label: 'Web Applications' },
    { id: 'Network Assets', icon: <Network className="w-4 h-4" />, label: 'Network Assets' },
    { id: 'Network Topology', icon: <Map className="w-4 h-4" />, label: 'Network Topologia' },
    { id: 'Upstream/Downstream', icon: <Database className="w-4 h-4" />, label: 'Upstream/Downstream' },
    { id: 'Clientes B2B', icon: <Users className="w-4 h-4" />, label: 'Clientes B2B' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#00ff88]/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0d0d0d]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00ff88] rounded-md flex items-center justify-center">
              <Terminal className="text-black w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">NOC Manager</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
              <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
              <span className="text-xs font-medium text-gray-300">{user?.email}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="text-gray-400 hover:text-white hover:bg-white/5">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Company Info Card */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 mb-8 flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="pr-6 border-r border-white/10">
              <h2 className="text-3xl font-bold text-white mb-1">YPN TECNOLOGIA</h2>
              <p className="text-xs text-gray-500 uppercase tracking-widest">CNPJ: 16.742.294/0001-67</p>
              <p className="text-[10px] text-gray-600 mt-1">Rodovia Mendel Steinbruch, 4294 - Pacatuba/CE</p>
            </div>
            <div className="flex flex-wrap gap-x-12 gap-y-6">
              <div className="space-y-3">
                <p className="text-[10px] text-[#00ff88] uppercase font-bold tracking-tighter">YPN Tecnologia</p>
                <div className="flex gap-8">
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">ASN</p>
                    <p className="text-xs font-mono text-gray-300">AS273500</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">IPv4</p>
                    <p className="text-xs font-mono text-gray-300">186.227.68.0/22</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">IPv6</p>
                    <p className="text-xs font-mono text-gray-300">2804:8f98::/32</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] text-[#00ff88] uppercase font-bold tracking-tighter">Conet Telecom</p>
                <div className="flex gap-8">
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">ASN</p>
                    <p className="text-xs font-mono text-gray-300">AS267576</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">IPv4</p>
                    <p className="text-xs font-mono text-gray-300">45.70.176.0/22</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">IPv6</p>
                    <p className="text-xs font-mono text-gray-300">2804:4388::/32</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {isAdmin && <AssetDialog isAdmin={isAdmin} />}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="assets" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-full h-12 w-full justify-start overflow-x-auto">
            <TabsTrigger value="assets" className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-500 rounded-full transition-all px-8 h-full text-sm font-medium hover:text-white">
              Ativos e Acessos
            </TabsTrigger>
            <TabsTrigger value="tickets" className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-500 rounded-full transition-all px-8 h-full text-sm font-medium hover:text-white">
              Tickets NOC
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-500 rounded-full transition-all px-8 h-full text-sm font-medium hover:text-white">
              Tarefas
            </TabsTrigger>
            <TabsTrigger value="datacenters" className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-500 rounded-full transition-all px-8 h-full text-sm font-medium hover:text-white">
              Datacenters / POPs
            </TabsTrigger>
            <TabsTrigger value="stock" className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-500 rounded-full transition-all px-8 h-full text-sm font-medium hover:text-white">
              Estoque
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-500 rounded-full transition-all px-8 h-full text-sm font-medium hover:text-white">
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="space-y-6">
            {/* Search Bar */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#00ff88] transition-colors" />
              <Input 
                placeholder="Buscar acessos por nome, tipo, fabricante ou modelo..." 
                className="pl-12 h-14 bg-[#141414] border-white/5 focus:border-[#00ff88]/50 rounded-xl text-lg transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Assets Accordion */}
            <Accordion multiple defaultValue={["Servers"]} className="space-y-4">
              {categories.map((cat) => (
                <AccordionItem key={cat.id} value={cat.id} className="border border-white/5 bg-[#141414] rounded-xl overflow-hidden px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-[#00ff88]">
                      {cat.icon}
                      <span className="font-bold text-sm uppercase tracking-wider">{cat.label}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                      {filteredAssets.filter(a => a.category === cat.id).map(asset => (
                        <AssetCard key={asset.id} asset={asset} isAdmin={isAdmin} />
                      ))}
                      {filteredAssets.filter(a => a.category === cat.id).length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-600 border border-dashed border-white/5 rounded-xl">
                          Nenhum ativo encontrado nesta categoria.
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          <TabsContent value="tickets">
            <TicketBoard tickets={tickets} customers={customers} isAdmin={isAdmin} onNotify={onWhatsAppNotification} settings={settings} />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskManager tasks={tasks} isAdmin={isAdmin} onNotify={onWhatsAppNotification} settings={settings} />
          </TabsContent>

          <TabsContent value="datacenters">
            <DatacenterGrid datacenters={datacenters} isAdmin={isAdmin} />
          </TabsContent>
          
          <TabsContent value="stock">
            <StockManager stock={stock} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsManager settings={settings} users={users} customers={customers} isAdmin={isAdmin} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

const AssetCard: React.FC<{ asset: any, isAdmin: boolean }> = ({ asset, isAdmin }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    if (!isAdmin) return;
    if (confirm("Deseja realmente excluir este ativo?")) {
      try {
        await deleteDoc(doc(db, 'assets', asset.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `assets/${asset.id}`);
      }
    }
  };

  return (
    <motion.div 
      layout
      className="bg-[#1c1c1c] border border-white/5 rounded-xl p-5 hover:border-[#00ff88]/30 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-[#00ff88]">
            {asset.category === 'Servers' && <Server className="w-5 h-5" />}
            {asset.category === 'Web Applications' && <Globe className="w-5 h-5" />}
            {asset.category === 'Network Assets' && <Network className="w-5 h-5" />}
            {asset.category === 'Network Topology' && <Map className="w-5 h-5" />}
            {asset.category === 'Clientes B2B' && <Users className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-bold text-gray-100">{asset.name}</h4>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
              {asset.type} <span className="mx-1 opacity-30">•</span> {asset.manufacturer}
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <AssetDialog isAdmin={isAdmin} asset={asset} trigger={
              <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 hover:text-white">
                <Edit2 className="w-4 h-4" />
              </Button>
            } />
            <Button variant="ghost" size="icon" onClick={handleDelete} className="w-8 h-8 text-gray-500 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="bg-black/40 rounded-lg p-3 flex items-center justify-between mb-4 border border-white/5 group/main">
        <div className="flex flex-col">
          <span className="text-[9px] text-gray-500 uppercase font-bold mb-1">
            {asset.category === 'Upstream/Downstream' ? 'DESIGNAÇÃO CI' : 'IPv4 / HOST'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#00ff88]">
              {asset.category === 'Upstream/Downstream' ? (asset.circuitId || 'Vazio') : (asset.ipv4 || asset.url || 'N/A')}
            </span>
            {(asset.ipv4 || asset.url || asset.circuitId) && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  const val = asset.category === 'Upstream/Downstream' ? asset.circuitId : (asset.ipv4 || asset.url);
                  if(val) navigator.clipboard.writeText(val);
                }}
                className="w-5 h-5 text-gray-500 hover:text-[#00ff88] opacity-0 group-hover/main:opacity-100 transition-all"
              >
                <Copy className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className={`${asset.status === 'Device Disabled' ? 'border-red-500/50 text-red-500' : 'border-[#00ff88]/50 text-[#00ff88]'} text-[8px] uppercase px-1.5 h-5`}>
            {asset.status}
          </Badge>
        </div>
      </div>

      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-1.5 bg-white/5 hover:bg-white/10 rounded-md text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
      >
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {isExpanded ? 'Ocultar propriedades' : 'Mais Detalhes'}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-2">
              {asset.category === 'Upstream/Downstream' ? (
                <div className="space-y-2">
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="IPv4 ENLACE" value={asset.enlaceIpv4} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="IPv6 ENLACE" value={asset.enlaceIpv6} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="VLAN v4" value={asset.vlanV4} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="VLAN v6" value={asset.vlanV6} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="ASN" value={asset.asn} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="BANDA CONTRATADA" value={asset.bandaContratada} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="BLOCO V4 CIDR" value={asset.blocoV4Cidr} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="BLOCO V6 CIDR" value={asset.blocoV6Cidr} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="AS-PATCH" value={asset.asPatch} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="COMMUNITY BH" value={asset.communityBh} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="CONTATO NOC" value={asset.contatoNoc} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="POP ABORDAGEM" value={asset.popAbordagem} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="SWITCH" value={asset.switch} />
                </div>
              ) : asset.category === 'Clientes B2B' ? (
                <div className="space-y-2">
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="ID CIRCUITO" value={asset.circuitId} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="ENDEREÇO" value={asset.address} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="VELOCIDADE" value={asset.speed} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="ENLACE IPv4" value={asset.enlaceIpv4} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="ENLACE IPv6" value={asset.enlaceIpv6} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="ID VLAN" value={asset.vlanId} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="IPv4 PÚBLICO" value={asset.publicIpv4} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="IPv6 PÚBLICO" value={asset.publicIpv6} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="PPPoE USER" value={asset.pppoeUser} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="PPPoE SENHA" value={asset.pppoePass} />
                </div>
              ) : asset.category === 'Network Topology' ? (
                <div className="space-y-2">
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="LINK DRAW.IO" value={asset.drawioLink} isLink />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="ANEXO" value={asset.attachmentUrl} isLink />
                </div>
              ) : (
                <div className="space-y-2">
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="IPv4" value={asset.ipv4} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="IPv6" value={asset.ipv6} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="URL/DOMAIN" value={asset.url} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="PORTA SSH" value={asset.sshPort} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="USER SSH" value={asset.sshUser} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="PASS SSH" value={asset.sshPassword} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="PORTA APP" value={asset.appPort} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="USER APP" value={asset.appUser} />
                  <PropertyRow icon={<Plus className="w-3 h-3" />} label="PASS APP" value={asset.appPassword} />
                  {asset.category === 'Network Assets' && (
                    <PropertyRow icon={<Plus className="w-3 h-3" />} label="SNMP COMMUNITY" value={asset.snmpCommunity} />
                  )}
                </div>
              )}
              
              {asset.notes && (
                <div className="mt-4">
                  <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Observações</p>
                  <p className="text-[11px] text-gray-400 bg-black/20 p-2 rounded border border-white/5 leading-relaxed">{asset.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PropertyRow({ icon, label, value, isLink }: { icon: any, label: string, value: string, isLink?: boolean }) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between group/row bg-black/40 hover:bg-black/60 transition-colors p-3 rounded-lg border border-white/5">
      <div className="flex items-center gap-2 text-gray-400">
        <div className="opacity-50">{icon}</div>
        <span className="text-[9px] font-bold uppercase tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {isLink && value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#00ff88] hover:underline font-mono">Link Externo</a>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#00ff88]">{value || 'Vazio'}</span>
            {value && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCopy}
                className="w-6 h-6 text-gray-500 hover:text-[#00ff88] transition-colors"
              >
                {copied ? <CheckCircle2 className="w-3 h-3 text-[#00ff88]" /> : <Copy className="w-3 h-3" />}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AssetDialog({ isAdmin, asset, trigger }: { isAdmin: boolean, asset?: any, trigger?: React.ReactElement }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    category: 'Servers',
    name: '',
    type: '',
    manufacturer: '',
    model: '',
    site: '',
    status: 'Ativo',
    ipv4: '',
    ipv6: '',
    url: '',
    sshPort: '',
    sshUser: '',
    sshPassword: '',
    appPort: '',
    appUser: '',
    appPassword: '',
    snmpCommunity: '',
    drawioLink: '',
    attachmentUrl: '',
    circuitId: '',
    address: '',
    speed: '',
    vlanId: '',
    vlanV4: '',
    vlanV6: '',
    asn: '',
    bandaContratada: '',
    blocoV4Cidr: '',
    blocoV6Cidr: '',
    asPatch: '',
    communityBh: '',
    contatoNoc: '',
    popAbordagem: '',
    switch: '',
    enlaceIpv4: '',
    enlaceIpv6: '',
    publicIpv4: '',
    publicIpv6: '',
    pppoeUser: '',
    pppoePass: '',
    notes: ''
  });

  useEffect(() => {
    if (asset) {
      setFormData({ ...asset });
    }
  }, [asset, open]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin) return;
    try {
      if (asset?.id) {
        await updateDoc(doc(db, 'assets', asset.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'assets'), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      }
      setOpen(false);
      if (!asset) {
        setFormData({
          category: 'Servers',
          name: '',
          type: '',
          manufacturer: '',
          model: '',
          site: '',
          status: 'Ativo',
          ipv4: '',
          ipv6: '',
          url: '',
          sshPort: '',
          sshUser: '',
          sshPassword: '',
          appPort: '',
          appUser: '',
          appPassword: '',
          snmpCommunity: '',
          drawioLink: '',
          attachmentUrl: '',
          circuitId: '',
          address: '',
          speed: '',
          vlanId: '',
          vlanV4: '',
          vlanV6: '',
          asn: '',
          bandaContratada: '',
          blocoV4Cidr: '',
          blocoV6Cidr: '',
          asPatch: '',
          communityBh: '',
          contatoNoc: '',
          popAbordagem: '',
          switch: '',
          enlaceIpv4: '',
          enlaceIpv6: '',
          publicIpv4: '',
          publicIpv6: '',
          pppoeUser: '',
          pppoePass: '',
          notes: ''
        });
      }
    } catch (err) {
      handleFirestoreError(err, asset ? OperationType.UPDATE : OperationType.CREATE, asset ? `assets/${asset.id}` : 'assets');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger || (
        <Button className="bg-[#00ff88] text-black font-bold hover:bg-[#00cc6e] px-6 py-6 rounded-xl shadow-[0_0_20px_rgba(0,255,136,0.2)]">
          <Plus className="w-5 h-5 mr-2" /> Novo Acesso
        </Button>
      )} />
      <DialogContent className="bg-[#0f0f0f] border-white/10 text-white max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col p-0 rounded-2xl shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DialogHeader className="p-6 border-b border-white/5 bg-[#141414] shrink-0">
            <DialogTitle className="flex items-center gap-3 text-[#00ff88] text-xl font-bold">
              <div className="w-8 h-8 bg-[#00ff88]/10 rounded-lg flex items-center justify-center">
                {asset ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              {asset ? 'Editar Registro de Acesso' : 'Novo Registro de Acesso'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="space-y-10 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">Categoria *</Label>
                  <Select required value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-12 focus:ring-[#00ff88]/20 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c1c] border-white/10 text-white">
                      <SelectItem value="Servers">Servers</SelectItem>
                      <SelectItem value="Web Applications">Web Applications</SelectItem>
                      <SelectItem value="Network Assets">Network Assets</SelectItem>
                      <SelectItem value="Network Topology">Network Topology</SelectItem>
                      <SelectItem value="Upstream/Downstream">Upstream/Downstream</SelectItem>
                      <SelectItem value="Clientes B2B">Clientes B2B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-12 focus:ring-[#00ff88]/20 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c1c] border-white/10 text-white">
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Manutenção">Manutenção</SelectItem>
                      <SelectItem value="Device Disabled">Device Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 text-[#00ff88] text-xs font-bold uppercase tracking-widest border-b border-white/5 pb-3">
                  <Database className="w-4 h-4" /> Informações Básicas
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-400">Nome / Identificação *</Label>
                    <Input required placeholder="Ex: Proxmox 01" className="bg-white/5 border-white/10 h-12" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                <div className="space-y-2">
                  <Label className="text-gray-400">Site / POP</Label>
                  <Input placeholder="Ex: POP-SP" className="bg-white/5 border-white/10 h-12" value={formData.site} onChange={(e) => setFormData({...formData, site: e.target.value})} />
                </div>
                {formData.category !== 'Network Topology' && formData.category !== 'Upstream/Downstream' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-gray-400">Fabricante</Label>
                      <Input placeholder="Ex: Cisco" className="bg-white/5 border-white/10 h-12" value={formData.manufacturer} onChange={(e) => setFormData({...formData, manufacturer: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400">Modelo</Label>
                      <Input placeholder="Ex: PowerEdge" className="bg-white/5 border-white/10 h-12" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {formData.category === 'Upstream/Downstream' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-[#00ff88] text-xs font-bold uppercase tracking-widest border-b border-white/5 pb-3">
                  <Network className="w-4 h-4" /> Detalhes do Link / CI
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2"><Label className="text-gray-400">Designação CI</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.circuitId} onChange={(e) => setFormData({...formData, circuitId: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">Banda Contratada</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.bandaContratada} onChange={(e) => setFormData({...formData, bandaContratada: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">IPv4 Enlace</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.enlaceIpv4} onChange={(e) => setFormData({...formData, enlaceIpv4: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">IPv6 Enlace</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.enlaceIpv6} onChange={(e) => setFormData({...formData, enlaceIpv6: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">VLAN v4</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.vlanV4} onChange={(e) => setFormData({...formData, vlanV4: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">VLAN v6</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.vlanV6} onChange={(e) => setFormData({...formData, vlanV6: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">ASN</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.asn} onChange={(e) => setFormData({...formData, asn: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">AS-PATCH</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.asPatch} onChange={(e) => setFormData({...formData, asPatch: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">Bloco V4 CIDR</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.blocoV4Cidr} onChange={(e) => setFormData({...formData, blocoV4Cidr: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">Bloco V6 CIDR</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.blocoV6Cidr} onChange={(e) => setFormData({...formData, blocoV6Cidr: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">Community BH</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.communityBh} onChange={(e) => setFormData({...formData, communityBh: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">Contato NOC</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.contatoNoc} onChange={(e) => setFormData({...formData, contatoNoc: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">POP Abordagem</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.popAbordagem} onChange={(e) => setFormData({...formData, popAbordagem: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">Switch</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.switch} onChange={(e) => setFormData({...formData, switch: e.target.value})} /></div>
                </div>
              </div>
            )}

            {formData.category === 'Clientes B2B' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-[#00ff88] text-xs font-bold uppercase tracking-widest border-b border-white/5 pb-3">
                  <Users className="w-4 h-4" /> Detalhes do Cliente B2B
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2"><Label className="text-gray-400">ID Circuito</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.circuitId} onChange={(e) => setFormData({...formData, circuitId: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">Velocidade</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.speed} onChange={(e) => setFormData({...formData, speed: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">Endereço</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">ID VLAN</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.vlanId} onChange={(e) => setFormData({...formData, vlanId: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">Enlace IPv4</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.enlaceIpv4} onChange={(e) => setFormData({...formData, enlaceIpv4: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">Enlace IPv6</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.enlaceIpv6} onChange={(e) => setFormData({...formData, enlaceIpv6: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">IPv4 Público</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.publicIpv4} onChange={(e) => setFormData({...formData, publicIpv4: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">IPv6 Público</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.publicIpv6} onChange={(e) => setFormData({...formData, publicIpv6: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">PPPoE USER</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.pppoeUser} onChange={(e) => setFormData({...formData, pppoeUser: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">PPPoE SENHA</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.pppoePass} onChange={(e) => setFormData({...formData, pppoePass: e.target.value})} /></div>
                </div>
              </div>
            )}

            {formData.category === 'Network Topology' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-[#00ff88] text-xs font-bold uppercase tracking-widest border-b border-white/5 pb-3">
                  <Map className="w-4 h-4" /> Detalhes da Topologia
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label className="text-gray-400">Link Draw.io</Label><Input placeholder="https://draw.io/..." className="bg-white/5 border-white/10 h-12" value={formData.drawioLink} onChange={(e) => setFormData({...formData, drawioLink: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-gray-400">URL Anexo / Arquivo</Label><Input placeholder="https://..." className="bg-white/5 border-white/10 h-12" value={formData.attachmentUrl} onChange={(e) => setFormData({...formData, attachmentUrl: e.target.value})} /></div>
                </div>
              </div>
            )}

            {(formData.category === 'Servers' || formData.category === 'Web Applications' || formData.category === 'Network Assets') && (
              <>
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-[#00ff88] text-xs font-bold uppercase tracking-widest border-b border-white/5 pb-3">
                    <Globe className="w-4 h-4" /> Endereço e Acesso
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2"><Label className="text-gray-400">IPv4 / Host</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.ipv4} onChange={(e) => setFormData({...formData, ipv4: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-gray-400">IPv6</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.ipv6} onChange={(e) => setFormData({...formData, ipv6: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-gray-400">URL / Domain</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-gray-400">Porta SSH</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.sshPort} onChange={(e) => setFormData({...formData, sshPort: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-gray-400">User SSH</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.sshUser} onChange={(e) => setFormData({...formData, sshUser: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-gray-400">Pass SSH</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.sshPassword} onChange={(e) => setFormData({...formData, sshPassword: e.target.value})} /></div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-[#00ff88] text-xs font-bold uppercase tracking-widest border-b border-white/5 pb-3">
                    <Terminal className="w-4 h-4" /> Credenciais Web / Outros
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2"><Label className="text-gray-400">Porta App</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.appPort} onChange={(e) => setFormData({...formData, appPort: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-gray-400">User App</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.appUser} onChange={(e) => setFormData({...formData, appUser: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-gray-400">Pass App</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.appPassword} onChange={(e) => setFormData({...formData, appPassword: e.target.value})} /></div>
                    {formData.category === 'Network Assets' && (
                      <div className="space-y-2 col-span-full"><Label className="text-gray-400">SNMP Community / Console Pass</Label><Input className="bg-white/5 border-white/10 h-12" value={formData.snmpCommunity} onChange={(e) => setFormData({...formData, snmpCommunity: e.target.value})} /></div>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-3">
              <Label className="text-gray-400">Observações</Label>
              <Textarea className="bg-white/5 border-white/10 min-h-[120px] focus:ring-[#00ff88]/20 text-base" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
            </div>
          </div>
        </div>
        <div className="p-8 border-t border-white/5 bg-[#141414] flex justify-end gap-4 shrink-0">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-gray-400 hover:text-white hover:bg-white/5 h-12 px-8">Cancelar</Button>
          <Button type="submit" className="bg-[#00ff88] text-black font-bold hover:bg-[#00cc6e] px-12 h-12 text-base shadow-[0_0_20px_rgba(0,255,136,0.15)]">Salvar Acesso</Button>
        </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TicketBoard({ tickets, customers, isAdmin, onNotify, settings }: { tickets: any[], customers: any[], isAdmin: boolean, onNotify: (msg: string, phone?: string) => void, settings: any }) {
  const columns = ["Em Aberto", "Em andamento", "Concluído"];
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    priority: 'Média', 
    status: 'Em Aberto',
    category: 'NOC',
    client: '',
    responsible: '',
    openedAt: new Date().toISOString(),
    slaDeadline: '',
    hours: 0,
    minutes: 0
  });
  const { user } = useAuth();

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'tickets'), {
        ...formData,
        createdBy: user?.displayName || user?.email,
        createdAt: serverTimestamp()
      });
      
      if (settings?.triggerTickets) {
        onNotify(`🎫 *Novo Ticket Criado*\n\n*Título:* ${formData.title}\n*Cliente:* ${formData.client}\n*Prioridade:* ${formData.priority}\n*Criado por:* ${user?.displayName || user?.email}`);
      }

      setIsNewTicketOpen(false);
      resetForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'tickets');
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      await updateDoc(doc(db, 'tickets', selectedTicket.id), formData);
      setSelectedTicket(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tickets/${selectedTicket.id}`);
    }
  };

  const resetForm = () => {
    setFormData({ 
      title: '', 
      description: '', 
      priority: 'Média', 
      status: 'Aberto',
      category: 'NOC',
      client: '',
      responsible: '',
      openedAt: new Date().toISOString(),
      slaDeadline: '',
      hours: 0,
      minutes: 0
    });
  };

  const calculateOpenTime = (openedAt: string) => {
    if (!openedAt) return "-";
    const start = new Date(openedAt).getTime();
    const now = new Date().getTime();
    const diff = now - start;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quadro de Tickets</h2>
        {isAdmin && (
          <Dialog open={isNewTicketOpen} onOpenChange={(v) => { setIsNewTicketOpen(v); if(v) resetForm(); }}>
            <DialogTrigger render={<Button className="bg-[#00ff88] text-black font-bold hover:bg-[#00cc6e]"><Plus className="w-4 h-4 mr-2" /> Novo Ticket</Button>} />
            <DialogContent className="bg-[#0f0f0f] border-white/10 text-white max-w-4xl p-0 overflow-hidden rounded-2xl">
              <DialogHeader className="p-6 border-b border-white/5 bg-[#141414]">
                <DialogTitle className="text-xl font-bold text-[#00ff88]">Novo Ticket NOC</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTicket} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-400 uppercase text-[10px] font-bold">Título do Ticket *</Label>
                    <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-white/5 border-white/10 h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400 uppercase text-[10px] font-bold">Cliente *</Label>
                    <Select value={formData.client} onValueChange={v => setFormData({...formData, client: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12"><SelectValue placeholder="Selecione o Cliente" /></SelectTrigger>
                      <SelectContent className="bg-[#1c1c1c] border-white/10 text-white">
                        {customers.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400 uppercase text-[10px] font-bold">Categoria *</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1c1c1c] border-white/10 text-white">
                        {["Engenharia IP", "Infraestrutura", "NOC", "Projetos", "Suporte"].map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400 uppercase text-[10px] font-bold">Prioridade</Label>
                    <Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1c1c1c] border-white/10 text-white">
                        {["Baixa", "Média", "Alta", "Crítica"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400 uppercase text-[10px] font-bold">Responsável *</Label>
                    <Select required value={formData.responsible} onValueChange={v => setFormData({...formData, responsible: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12"><SelectValue placeholder="Selecione o Responsável" /></SelectTrigger>
                      <SelectContent className="bg-[#1c1c1c] border-white/10 text-white">
                        {["Nairton Braga", "Equipe NOC", "Engenharia", "Infraestrutura"].map(resp => <SelectItem key={resp} value={resp}>{resp}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400 uppercase text-[10px] font-bold">SLA Deadline *</Label>
                    <Input required type="datetime-local" value={formData.slaDeadline} onChange={e => setFormData({...formData, slaDeadline: e.target.value})} className="bg-white/5 border-white/10 h-12" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 uppercase text-[10px] font-bold">Descrição</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-white/5 border-white/10 min-h-[100px]" />
                </div>
                <Button type="submit" className="w-full bg-[#00ff88] text-black font-bold h-12 text-lg">Criar Ticket</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
        {columns.map(col => (
          <div key={col} className="bg-[#141414] border border-white/5 rounded-2xl p-4 min-w-[320px] flex-1">
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                <div className={`w-2 h-2 rounded-full ${col === 'Concluído' ? 'bg-[#00ff88]' : col === 'Em Atendimento' ? 'bg-blue-500' : col === 'Aberto' ? 'bg-yellow-500' : 'bg-gray-500'}`} />
                {col}
              </h3>
              <Badge variant="outline" className="border-white/10 text-gray-500">{tickets.filter(t => t.status === col).length}</Badge>
            </div>
            <div className="space-y-4">
              {tickets.filter(t => t.status === col).map(ticket => (
                <Card 
                  key={ticket.id} 
                  onClick={() => { setSelectedTicket(ticket); setFormData({ ...formData, ...ticket }); }}
                  className="bg-[#1c1c1c] border-white/5 hover:border-[#00ff88]/30 transition-all cursor-pointer group"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[10px] text-[#00ff88] font-bold uppercase">{ticket.client}</p>
                        <h4 className="font-bold text-sm text-gray-100">{ticket.title}</h4>
                      </div>
                      <Badge className={`${ticket.priority === 'Crítica' ? 'bg-red-500' : 'bg-white/10'} text-[9px]`}>{ticket.priority}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[8px] border-white/10 text-gray-500 uppercase">{ticket.category}</Badge>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <Clock className="w-3 h-3" />
                        {ticket.openedAt ? new Date(ticket.openedAt).toLocaleDateString() : '-'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">{ticket.responsible || 'Sem resp.'}</span>
                        <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-[10px]">
                          {ticket.responsible?.charAt(0).toUpperCase() || '?'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Ticket Details Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(v) => { if(!v) setSelectedTicket(null); }}>
        <DialogContent className="bg-[#0f0f0f] border-white/10 text-white max-w-5xl p-0 overflow-hidden rounded-2xl flex flex-col max-h-[95vh]">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#141414]">
            <div className="flex items-center gap-6">
              <Tabs defaultValue="details" className="h-10">
                <TabsList className="bg-transparent border-none p-0 h-full">
                  <TabsTrigger value="details" className="data-[state=active]:text-[#00ff88] data-[state=active]:border-b-2 data-[state=active]:border-[#00ff88] rounded-none px-4 h-full bg-transparent border-none text-xs font-bold uppercase tracking-widest text-gray-500">Detalhes</TabsTrigger>
                  <TabsTrigger value="comments" className="data-[state=active]:text-[#00ff88] data-[state=active]:border-b-2 data-[state=active]:border-[#00ff88] rounded-none px-4 h-full bg-transparent border-none text-xs font-bold uppercase tracking-widest text-gray-500">Comentários (0)</TabsTrigger>
                  <TabsTrigger value="attachments" className="data-[state=active]:text-[#00ff88] data-[state=active]:border-b-2 data-[state=active]:border-[#00ff88] rounded-none px-4 h-full bg-transparent border-none text-xs font-bold uppercase tracking-widest text-gray-500">Anexos (0)</TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:text-[#00ff88] data-[state=active]:border-b-2 data-[state=active]:border-[#00ff88] rounded-none px-4 h-full bg-transparent border-none text-xs font-bold uppercase tracking-widest text-gray-500">Histórico</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-gray-500"><Plus className="w-4 h-4" /></Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 px-6 h-9">
                <Edit2 className="w-4 h-4" /> Editar
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-8 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">Cliente *</Label>
                    <Select value={formData.client} onValueChange={v => setFormData({...formData, client: v})}>
                      <SelectTrigger className="bg-[#1c1c1c] border-white/5 h-11 text-sm font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1c1c1c] border-white/10 text-white">
                        {customers.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">Categoria *</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                      <SelectTrigger className="bg-[#1c1c1c] border-white/5 h-11 text-sm font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1c1c1c] border-white/10 text-white">
                        {["Engenharia IP", "Infraestrutura", "NOC", "Projetos", "Suporte"].map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">Abertura</Label>
                    <Input readOnly value={formData.openedAt ? new Date(formData.openedAt).toLocaleString('pt-BR') : '-'} className="bg-[#1c1c1c] border-white/5 h-11 text-sm font-bold text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">Tempo Aberto</Label>
                    <Input readOnly value={calculateOpenTime(formData.openedAt)} className="bg-[#1c1c1c] border-white/5 h-11 text-sm font-bold text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">SLA / Prazo *</Label>
                    <Input type="datetime-local" value={formData.slaDeadline} onChange={e => setFormData({...formData, slaDeadline: e.target.value})} className="bg-[#1c1c1c] border-white/5 h-11 text-sm font-bold" />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">Status *</Label>
                    <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                      <SelectTrigger className="bg-[#1c1c1c] border-white/5 h-11 text-sm font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1c1c1c] border-white/10 text-white">
                        {columns.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">Prioridade *</Label>
                    <Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: v})}>
                      <SelectTrigger className="bg-[#1c1c1c] border-white/5 h-11 text-sm font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1c1c1c] border-white/10 text-white">
                        {["Baixa", "Média", "Alta", "Crítica"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">Responsável *</Label>
                    <Select required value={formData.responsible} onValueChange={v => setFormData({...formData, responsible: v})}>
                      <SelectTrigger className="bg-[#1c1c1c] border-white/5 h-11 text-sm font-bold"><SelectValue placeholder="Selecione o Responsável" /></SelectTrigger>
                      <SelectContent className="bg-[#1c1c1c] border-white/10 text-white">
                        {["Nairton Braga", "Equipe NOC", "Engenharia", "Infraestrutura"].map(resp => <SelectItem key={resp} value={resp}>{resp}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Controle de Horas */}
              <div className="space-y-6 pt-8 border-t border-white/5">
                <div className="flex items-center gap-3 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                  <Clock className="w-4 h-4" /> Controle de Horas
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="bg-[#141414] border-white/5 p-6 rounded-xl">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-4">Total Acumulado</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] text-gray-600 uppercase">Horas</Label>
                        <Input type="number" value={formData.hours} onChange={e => setFormData({...formData, hours: parseInt(e.target.value)})} className="bg-[#0a0a0a] border-white/5 h-14 text-2xl font-bold text-center" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] text-gray-600 uppercase">Minutos</Label>
                        <Input type="number" value={formData.minutes} onChange={e => setFormData({...formData, minutes: parseInt(e.target.value)})} className="bg-[#0a0a0a] border-white/5 h-14 text-2xl font-bold text-center" />
                      </div>
                    </div>
                  </Card>
                  <Card className="bg-blue-600 border-none p-6 rounded-xl flex flex-col justify-between shadow-[0_10px_30px_rgba(37,99,235,0.3)]">
                    <div>
                      <p className="text-[10px] text-blue-200 uppercase font-bold mb-1">Total Geral (com sessão)</p>
                      <p className="text-5xl font-bold text-white tracking-tighter">{formData.hours}h <span className="text-3xl text-blue-200">{formData.minutes.toString().padStart(2, '0')}m</span></p>
                    </div>
                    <p className="text-[9px] text-blue-300 uppercase font-bold tracking-widest mt-4">Tempo Total Registrado</p>
                  </Card>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-6 border-t border-white/5 bg-[#141414] flex justify-between items-center">
            <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="text-gray-500 hover:text-white">Fechar</Button>
            <Button onClick={handleUpdateTicket} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-12 h-12 rounded-lg flex items-center gap-3">
              <Database className="w-5 h-5" /> Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskManager({ tasks, isAdmin, onNotify, settings }: { tasks: any[], isAdmin: boolean, onNotify: (msg: string, phone?: string) => void, settings: any }) {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    priority: 'Média', 
    status: 'Pendente',
    responsible: '',
    deadline: '',
    phone: ''
  });
  const { user } = useAuth();

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'tasks'), {
        ...formData,
        createdBy: user?.displayName || user?.email,
        createdAt: serverTimestamp()
      });
      
      if (settings?.triggerTasks) {
        const msg = `📝 *Nova Tarefa Atribuída*\n\n*Título:* ${formData.title}\n*Responsável:* ${formData.responsible}\n*Prazo:* ${formData.deadline ? new Date(formData.deadline).toLocaleString() : 'Não definido'}\n*Prioridade:* ${formData.priority}`;
        onNotify(msg, formData.phone || settings.notificationPhone);
      }

      setIsNewTaskOpen(false);
      setFormData({ title: '', description: '', priority: 'Média', status: 'Pendente', responsible: '', deadline: '', phone: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'tasks');
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const deleteTask = async (id: string) => {
    if (!isAdmin) return;
    if (confirm("Deseja excluir esta tarefa?")) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `tasks/${id}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tarefas Operacionais</h2>
          <p className="text-gray-500 text-sm">Gestão de atividades e manutenções</p>
        </div>
        {isAdmin && (
          <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
            <DialogTrigger render={<Button className="bg-[#00ff88] text-black font-bold hover:bg-[#00cc6e]"><Plus className="w-4 h-4 mr-2" /> Nova Tarefa</Button>} />
            <DialogContent className="bg-[#141414] border-white/10 text-white max-w-2xl p-8">
              <DialogHeader className="mb-6"><DialogTitle className="text-2xl font-bold text-[#00ff88]">Nova Tarefa</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label>Título da Tarefa</Label>
                  <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição / Instruções</Label>
                  <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-white/5 border-white/10 min-h-[100px]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Responsável</Label>
                    <Input required value={formData.responsible} onChange={e => setFormData({...formData, responsible: e.target.value})} placeholder="Nome do técnico" className="bg-white/5 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp para Alerta</Label>
                    <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="5585999999999" className="bg-white/5 border-white/10" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prazo</Label>
                    <Input type="datetime-local" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="bg-white/5 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1c1c1c] border-white/10 text-white">
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Crítica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-[#00ff88] text-black font-bold h-12">Criar e Notificar</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map(task => (
          <Card key={task.id} className="bg-[#141414] border-white/5 hover:border-white/10 transition-all group">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <Badge className={`${task.priority === 'Crítica' ? 'bg-red-500' : task.priority === 'Alta' ? 'bg-orange-500' : 'bg-white/10'} text-[9px]`}>
                  {task.priority}
                </Badge>
                <div className="flex items-center gap-2">
                  <Select value={task.status} onValueChange={(v) => updateTaskStatus(task.id, v)}>
                    <SelectTrigger className="w-[110px] h-7 text-[10px] bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c1c] border-white/10 text-white">
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Em Execução">Em Execução</SelectItem>
                      <SelectItem value="Concluída">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)} className="w-7 h-7 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">{task.title}</h4>
                <p className="text-sm text-gray-500 line-clamp-3">{task.description}</p>
              </div>
              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Responsável:</span>
                  <span className="font-bold text-[#00ff88]">{task.responsible}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Prazo:</span>
                  <span className="flex items-center gap-1 text-gray-300">
                    <Calendar className="w-3 h-3" />
                    {task.deadline ? new Date(task.deadline).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {tasks.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-2xl">
            <CheckCircle2 className="w-10 h-10 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma tarefa pendente no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsManager({ settings, users, customers, isAdmin }: { settings: any | null, users: any[], customers: any[], isAdmin: boolean }) {
  const [formData, setFormData] = useState({
    evolutionWebUrl: "",
    evolutionWebApiKey: "",
    evolutionWebInstance: "",
    notificationPhone: "",
    triggerTasks: false,
    triggerTickets: false
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        evolutionWebUrl: settings.evolutionWebUrl || "",
        evolutionWebApiKey: settings.evolutionWebApiKey || "",
        evolutionWebInstance: settings.evolutionWebInstance || "",
        notificationPhone: settings.notificationPhone || "",
        triggerTasks: settings.triggerTasks || false,
        triggerTickets: settings.triggerTickets || false
      });
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, 'settings', 'global'), formData);
    } catch (err) {
      try {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'settings', 'global'), formData, { merge: true });
      } catch (innerErr) {
        handleFirestoreError(innerErr, OperationType.WRITE, 'settings/global');
      }
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Settings className="w-8 h-8 text-[#00ff88]" /> Configurações
        </h2>
        <p className="text-gray-500">Gerencie integrações e parâmetros do sistema</p>
      </div>

      <Tabs defaultValue="evolution" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl h-12 w-full justify-start">
          <TabsTrigger value="evolution" className="data-[state=active]:bg-[#00ff88] data-[state=active]:text-black text-gray-500 rounded-lg transition-all px-8 h-full text-sm font-medium">
            Evolution WEB
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" className="data-[state=active]:bg-[#00ff88] data-[state=active]:text-black text-gray-500 rounded-lg transition-all px-8 h-full text-sm font-medium">
              Usuários
            </TabsTrigger>
          )}
          <TabsTrigger value="customers" className="data-[state=active]:bg-[#00ff88] data-[state=active]:text-black text-gray-500 rounded-lg transition-all px-8 h-full text-sm font-medium">
            Clientes
          </TabsTrigger>
          <TabsTrigger value="general" className="data-[state=active]:bg-[#00ff88] data-[state=active]:text-black text-gray-500 rounded-lg transition-all px-8 h-full text-sm font-medium">
            Geral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evolution" className="space-y-6">
          <Card className="bg-[#141414] border-white/5 p-8 rounded-2xl">
            <form onSubmit={handleSave} className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-[#00ff88] text-xs font-bold uppercase tracking-widest border-b border-white/5 pb-3">
                  <Globe className="w-4 h-4" /> API de Integração
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-full">
                    <Label className="text-gray-400">URL da API Evolution</Label>
                    <Input 
                      disabled={!isAdmin}
                      value={formData.evolutionWebUrl}
                      onChange={e => setFormData({...formData, evolutionWebUrl: e.target.value})}
                      placeholder="https://api.evolution.com"
                      className="bg-white/5 border-white/10 h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400">API Key</Label>
                    <Input 
                      disabled={!isAdmin}
                      type="password"
                      value={formData.evolutionWebApiKey}
                      onChange={e => setFormData({...formData, evolutionWebApiKey: e.target.value})}
                      placeholder="Sua API Key"
                      className="bg-white/5 border-white/10 h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400">Nome da Instância</Label>
                    <Input 
                      disabled={!isAdmin}
                      value={formData.evolutionWebInstance}
                      onChange={e => setFormData({...formData, evolutionWebInstance: e.target.value})}
                      placeholder="Instancia_NOC"
                      className="bg-white/5 border-white/10 h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400">Telefone para Alertas (Global)</Label>
                    <Input 
                      disabled={!isAdmin}
                      value={formData.notificationPhone}
                      onChange={e => setFormData({...formData, notificationPhone: e.target.value})}
                      placeholder="5585999999999"
                      className="bg-white/5 border-white/10 h-12 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 text-[#00ff88] text-xs font-bold uppercase tracking-widest border-b border-white/5 pb-3">
                  <AlertCircle className="w-4 h-4" /> Gatilhos de Notificação (WhatsApp)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-gray-200">Notificar Tarefas</p>
                      <p className="text-xs text-gray-500">Enviar alerta ao criar nova tarefa</p>
                    </div>
                    <button 
                      disabled={!isAdmin}
                      type="button"
                      onClick={() => setFormData({...formData, triggerTasks: !formData.triggerTasks})}
                      className={`w-12 h-6 rounded-full transition-all relative ${formData.triggerTasks ? 'bg-[#00ff88]' : 'bg-gray-700'} ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.triggerTasks ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-gray-200">Notificar Tickets</p>
                      <p className="text-xs text-gray-500">Enviar alerta ao criar novo ticket</p>
                    </div>
                    <button 
                      disabled={!isAdmin}
                      type="button"
                      onClick={() => setFormData({...formData, triggerTickets: !formData.triggerTickets})}
                      className={`w-12 h-6 rounded-full transition-all relative ${formData.triggerTickets ? 'bg-[#00ff88]' : 'bg-gray-700'} ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.triggerTickets ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <Button type="submit" className="w-full bg-[#00ff88] text-black font-bold h-14 rounded-xl hover:bg-[#00cc6e] text-base shadow-[0_0_20px_rgba(0,255,136,0.1)]">
                  Salvar Configurações
                </Button>
              )}
            </form>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-[#141414] border-white/5 p-8 rounded-2xl">
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-[#00ff88] text-xs font-bold uppercase tracking-widest border-b border-white/5 pb-3">
                  <User className="w-4 h-4" /> Gestão de Usuários
                </div>
                <div className="space-y-4">
                  {users.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center font-bold">
                          {u.displayName?.charAt(0) || u.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">{u.displayName || 'Sem nome'}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                      <Select value={u.role || 'pending'} onValueChange={(v) => updateUserRole(u.id, v)}>
                        <SelectTrigger className="w-[120px] bg-white/5 border-white/10 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1c1c1c] border-white/10 text-white">
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="customers">
          <CustomerManager customers={customers} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="general">
          <Card className="bg-[#141414] border-white/5 p-12 rounded-2xl text-center">
            <p className="text-gray-500">Configurações gerais em desenvolvimento...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CustomerManager({ customers, isAdmin }: { customers: any[], isAdmin: boolean }) {
  const [formData, setFormData] = useState({ name: '', address: '', cpfCnpj: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    try {
      await addDoc(collection(db, 'customers'), {
        name: formData.name.toUpperCase(),
        address: formData.address.toUpperCase(),
        cpfCnpj: formData.cpfCnpj.toUpperCase(),
        createdAt: serverTimestamp()
      });
      setFormData({ name: '', address: '', cpfCnpj: '' });
      setIsAdding(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'customers');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (confirm("Deseja excluir este cliente?")) {
      try {
        await deleteDoc(doc(db, 'customers', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `customers/${id}`);
      }
    }
  };

  return (
    <Card className="bg-[#141414] border-white/5 p-8 rounded-2xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-3 text-[#00ff88] text-xs font-bold uppercase tracking-widest">
            <Users className="w-4 h-4" /> Gestão de Clientes
          </div>
          {isAdmin && (
            <Button onClick={() => setIsAdding(!isAdding)} variant="ghost" size="sm" className="text-[#00ff88] hover:bg-[#00ff88]/10">
              {isAdding ? 'Cancelar' : <><Plus className="w-4 h-4 mr-2" /> Novo Cliente</>}
            </Button>
          )}
        </div>

        {isAdding && (
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl space-y-4">
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs uppercase">Nome</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-white/5 border-white/10 uppercase h-10" required />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs uppercase">Endereço</Label>
                <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="bg-white/5 border-white/10 uppercase h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs uppercase">CPF/CNPJ</Label>
                <Input value={formData.cpfCnpj} onChange={e => setFormData({...formData, cpfCnpj: e.target.value})} className="bg-white/5 border-white/10 uppercase h-10" />
              </div>
              <Button type="submit" className="md:col-span-3 bg-[#00ff88] text-black font-bold h-10">Salvar Cliente</Button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customers.map(customer => (
            <div key={customer.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 group">
              <div>
                <p className="text-sm font-bold text-gray-200">{customer.name}</p>
                <p className="text-[10px] text-gray-500 uppercase">{customer.address || 'SEM ENDEREÇO'}</p>
                <p className="text-[10px] text-gray-600 font-mono">{customer.cpfCnpj || 'SEM CPF/CNPJ'}</p>
              </div>
              {isAdmin && (
                <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-all">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          {customers.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-600 border border-dashed border-white/5 rounded-xl">
              Nenhum cliente cadastrado.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function DatacenterGrid({ datacenters, isAdmin }: { datacenters: any[], isAdmin: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Datacenters</h2>
          <p className="text-gray-500 text-sm">Gestão de POPs e energia ENEL Ceará</p>
        </div>
        {isAdmin && <NewDatacenterDialog />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {datacenters.map(dc => (
          <DatacenterCard key={dc.id} dc={dc} isAdmin={isAdmin} />
        ))}
      </div>
    </div>
  );
}

function DatacenterCard({ dc, isAdmin }: { dc: any, isAdmin: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...dc });

  const handleUpdate = async () => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'datacenters', dc.id), formData);
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `datacenters/${dc.id}`);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) return;
    if (confirm("Excluir este datacenter?")) {
      try {
        await deleteDoc(doc(db, 'datacenters', dc.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `datacenters/${dc.id}`);
      }
    }
  };

  return (
    <Card className="bg-[#141414] border-white/5 hover:border-[#00ff88]/30 transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">{dc.name}</CardTitle>
            <p className="text-[10px] text-gray-500 flex items-center gap-1">
              <Map className="w-2 h-2" /> {dc.location}
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-1">
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger render={<Button variant="ghost" size="icon" className="w-7 h-7 text-gray-500"><Edit2 className="w-3 h-3" /></Button>} />
              <DialogContent className="bg-[#141414] border-white/10 text-white max-w-6xl max-h-[90vh] overflow-y-auto custom-scrollbar p-8">
                <DialogHeader className="mb-6"><DialogTitle className="text-2xl font-bold text-[#00ff88]">Editar Datacenter</DialogTitle></DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-white/5 border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <Label>Localização</Label>
                      <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="bg-white/5 border-white/10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="bg-white/5 border-white/10" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cliente ENEL</Label>
                      <Input value={formData.enelClientId} onChange={e => setFormData({...formData, enelClientId: e.target.value})} className="bg-white/5 border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF/CNPJ ENEL</Label>
                      <Input value={formData.enelCpfCnpj} onChange={e => setFormData({...formData, enelCpfCnpj: e.target.value})} className="bg-white/5 border-white/10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Titular ENEL</Label>
                      <Input value={formData.enelOwnerName} onChange={e => setFormData({...formData, enelOwnerName: e.target.value})} className="bg-white/5 border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF do Titular</Label>
                      <Input value={formData.enelOwnerCpf} onChange={e => setFormData({...formData, enelOwnerCpf: e.target.value})} className="bg-white/5 border-white/10" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                  <Button onClick={handleUpdate} className="bg-[#00ff88] text-black">Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={handleDelete} className="w-7 h-7 text-gray-500 hover:text-red-500"><Trash2 className="w-3 h-3" /></Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <Badge className={`${dc.type === 'Próprio' ? 'bg-[#00ff88] text-black' : 'bg-blue-500'} text-[10px]`}>
          {dc.type}
        </Badge>
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Endereço</p>
            <p className="text-xs text-gray-300">{dc.address}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] text-gray-500 uppercase font-bold">Cliente ENEL</p>
              <p className="text-xs text-[#00ff88] font-mono">{dc.enelClientId || '-'}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase font-bold">CPF/CNPJ ENEL</p>
              <p className="text-xs text-gray-300 font-mono">{dc.enelCpfCnpj || '-'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
            <div>
              <p className="text-[9px] text-gray-500 uppercase font-bold">Titular ENEL</p>
              <p className="text-xs text-gray-300">{dc.enelOwnerName || '-'}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase font-bold">CPF do Titular</p>
              <p className="text-xs text-gray-300 font-mono">{dc.enelOwnerCpf || '-'}</p>
            </div>
          </div>
          <div className="pt-2 border-t border-white/5">
            <p className="text-[9px] text-gray-500 uppercase font-bold">Última Limpeza</p>
            <p className="text-xs text-gray-300">{dc.lastCleaning ? new Date(dc.lastCleaning).toLocaleDateString() : '-'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NewDatacenterDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'Próprio',
    address: '',
    enelClientId: '',
    enelCpfCnpj: '',
    enelOwnerName: '',
    enelOwnerCpf: '',
    lastCleaning: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'datacenters'), formData);
      setOpen(false);
      setFormData({ name: '', location: '', type: 'Próprio', address: '', enelClientId: '', enelCpfCnpj: '', enelOwnerName: '', enelOwnerCpf: '', lastCleaning: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'datacenters');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-[#00ff88] text-black font-bold hover:bg-[#00cc6e]"><Plus className="w-4 h-4 mr-2" /> Adicionar Datacenter</Button>} />
      <DialogContent className="bg-[#141414] border-white/10 text-white max-w-6xl max-h-[90vh] overflow-y-auto custom-scrollbar p-8">
        <DialogHeader className="mb-6"><DialogTitle className="text-2xl font-bold text-[#00ff88]">Novo Datacenter / POP</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nome</Label><Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-white/5 border-white/10" /></div>
            <div className="space-y-2"><Label>Localização</Label><Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="bg-white/5 border-white/10" /></div>
          </div>
          <div className="space-y-2"><Label>Endereço</Label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="bg-white/5 border-white/10" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Tipo</Label>
              <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Próprio">Próprio</SelectItem><SelectItem value="Alugado">Alugado</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Última Limpeza</Label><Input type="date" value={formData.lastCleaning} onChange={e => setFormData({...formData, lastCleaning: e.target.value})} className="bg-white/5 border-white/10" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Cliente ENEL</Label><Input value={formData.enelClientId} onChange={e => setFormData({...formData, enelClientId: e.target.value})} className="bg-white/5 border-white/10" /></div>
            <div className="space-y-2"><Label>CPF/CNPJ ENEL</Label><Input value={formData.enelCpfCnpj} onChange={e => setFormData({...formData, enelCpfCnpj: e.target.value})} className="bg-white/5 border-white/10" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Titular ENEL</Label><Input value={formData.enelOwnerName} onChange={e => setFormData({...formData, enelOwnerName: e.target.value})} className="bg-white/5 border-white/10" /></div>
            <div className="space-y-2"><Label>CPF do Titular</Label><Input value={formData.enelOwnerCpf} onChange={e => setFormData({...formData, enelOwnerCpf: e.target.value})} className="bg-white/5 border-white/10" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4"><Button type="submit" className="bg-[#00ff88] text-black">Salvar</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StockManager({ stock, isAdmin }: { stock: any[], isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [formData, setFormData] = useState({ name: '', quantity: 0, minQuantity: 0, category: 'Infraestrutura' });

  const stockCategories = ["Infraestrutura", "Rede", "Servidores", "Ferramentas", "Cabos", "SFP/Módulos", "Outros"];

  const filteredStock = filterCategory === "all" 
    ? stock 
    : stock.filter(item => item.category === filterCategory);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        quantity: editingItem.quantity || 0,
        minQuantity: editingItem.minQuantity || 0,
        category: editingItem.category || 'Infraestrutura'
      });
    } else {
      setFormData({ name: '', quantity: 0, minQuantity: 0, category: 'Infraestrutura' });
    }
  }, [editingItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'stock', editingItem.id), formData);
      } else {
        await addDoc(collection(db, 'stock'), formData);
      }
      setOpen(false);
      setEditingItem(null);
      setFormData({ name: '', quantity: 0, minQuantity: 0, category: 'Infraestrutura' });
    } catch (err) {
      handleFirestoreError(err, editingItem ? OperationType.UPDATE : OperationType.CREATE, editingItem ? `stock/${editingItem.id}` : 'stock');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir este item do estoque?")) {
      try {
        await deleteDoc(doc(db, 'stock', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `stock/${id}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Estoque NOC</h2>
          <p className="text-gray-500 text-sm">Controle de materiais e ativos em estoque</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
              <SelectValue placeholder="Filtrar Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-[#1c1c1c] border-white/10 text-white">
              <SelectItem value="all">Todas Categorias</SelectItem>
              {stockCategories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) setEditingItem(null); }}>
              <DialogTrigger render={<Button className="bg-[#00ff88] text-black font-bold hover:bg-[#00cc6e]"><Plus className="w-4 h-4 mr-2" /> Novo Item</Button>} />
              <DialogContent className="bg-[#141414] border-white/10 text-white max-w-2xl p-8">
                <DialogHeader className="mb-6"><DialogTitle className="text-2xl font-bold text-[#00ff88]">{editingItem ? 'Editar Item' : 'Adicionar ao Estoque'}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                  <div className="space-y-2"><Label>Nome do Item</Label><Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-white/5 border-white/10" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Quantidade Atual</Label><Input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} className="bg-white/5 border-white/10" /></div>
                    <div className="space-y-2"><Label>Qtd. Mínima</Label><Input type="number" value={formData.minQuantity} onChange={e => setFormData({...formData, minQuantity: parseInt(e.target.value)})} className="bg-white/5 border-white/10" /></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1c1c1c] border-white/10 text-white">
                        {stockCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full bg-[#00ff88] text-black font-bold h-12">{editingItem ? 'Salvar Alterações' : 'Salvar no Estoque'}</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredStock.map(item => (
          <Card key={item.id} className={`group bg-[#141414] border-white/5 hover:border-white/10 transition-all ${item.quantity <= item.minQuantity ? 'border-red-500/50 bg-red-500/5' : ''}`}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-gray-100">{item.name}</h4>
                  <Badge variant="outline" className="text-[9px] uppercase border-white/10 text-gray-500">{item.category || 'Sem categoria'}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {item.quantity <= item.minQuantity && (
                    <Badge className="bg-red-500/20 text-red-500 border-red-500/50 text-[8px] animate-pulse">ESTOQUE BAIXO</Badge>
                  )}
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-7 h-7 text-gray-500 hover:text-[#00ff88]"
                        onClick={() => { setEditingItem(item); setOpen(true); }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-7 h-7 text-gray-500 hover:text-red-500"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-end justify-between pt-4 border-t border-white/5">
                <div>
                  <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Quantidade</p>
                  <p className={`text-3xl font-bold tracking-tighter ${item.quantity <= item.minQuantity ? 'text-red-500' : 'text-[#00ff88]'}`}>{item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Mínimo</p>
                  <p className="text-sm font-mono text-gray-400">{item.minQuantity}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredStock.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-2xl">
            <Package className="w-10 h-10 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum item encontrado nesta categoria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Login() {
  const { login, authError } = useAuth();
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-[#00ff88] rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(0,255,136,0.2)]">
            <Terminal className="text-black w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-white">NOC Manager</h1>
          <p className="text-gray-500">Sistema de documentação e gestão de ativos de rede.</p>
        </div>

        {authError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{authError}</p>
          </div>
        )}

        <Button 
          onClick={login}
          className="w-full h-14 bg-white text-black font-bold text-lg rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Entrar com Google
        </Button>
        <p className="text-[10px] text-gray-600 uppercase tracking-widest">Acesso restrito à equipe autorizada</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

