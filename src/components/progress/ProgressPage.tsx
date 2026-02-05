import { useEffect, useState } from 'react';
import { 
  Plus, 
  Camera, 
  Scale, 
  TrendingUp,
  TrendingDown,
  Trash2,
  Image
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useAuthStore } from '../../stores/authStore';
import { useProgressStore } from '../../stores/progressStore';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import type { ProgressPhoto } from '../../types';

type Tab = 'weight' | 'photos' | 'measurements';

export function ProgressPage() {
  const { user } = useAuthStore();
  const { 
    measurements, 
    photos, 
    fetchMeasurements, 
    fetchPhotos,
    deletePhoto,
    getWeightHistory,
    getWeightChange
  } = useProgressStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('weight');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [photoFilter, setPhotoFilter] = useState<ProgressPhoto['category'] | 'all'>('all');

  useEffect(() => {
    if (user?.id) {
      fetchMeasurements(user.id);
      fetchPhotos(user.id);
    }
  }, [user?.id]);

  const weightHistory = getWeightHistory();
  const weightChange = getWeightChange();

  const filteredPhotos = photoFilter === 'all' 
    ? photos 
    : photos.filter(p => p.category === photoFilter);

  const tabs = [
    { id: 'weight', label: 'Peso', icon: Scale },
    { id: 'photos', label: 'Fotos', icon: Camera },
    { id: 'measurements', label: 'Medidas', icon: TrendingUp },
  ] as const;

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi progreso</h1>
          <p className="text-gray-500">Sigue tu evolución física</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'weight' && (
            <button
              onClick={() => setShowWeightModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-5 h-5" />
              Registrar peso
            </button>
          )}
          {activeTab === 'photos' && (
            <button
              onClick={() => setShowPhotoModal(true)}
              className="btn btn-primary"
            >
              <Camera className="w-5 h-5" />
              Añadir foto
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Weight Tab */}
      {activeTab === 'weight' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-sm text-gray-500 mb-1">Peso actual</p>
              <p className="text-2xl font-bold text-gray-900">
                {measurements[0]?.weight || '-'} kg
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 mb-1">Peso objetivo</p>
              <p className="text-2xl font-bold text-primary-600">
                {user?.goals?.target_weight || '-'} kg
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 mb-1">Cambio total</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${weightChange.total > 0 ? 'text-green-600' : weightChange.total < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {weightChange.total > 0 ? '+' : ''}{weightChange.total} kg
                </p>
                {weightChange.total !== 0 && (
                  weightChange.total > 0 
                    ? <TrendingUp className="w-5 h-5 text-green-600" />
                    : <TrendingDown className="w-5 h-5 text-red-600" />
                )}
              </div>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 mb-1">Último mes</p>
              <p className={`text-2xl font-bold ${weightChange.lastMonth > 0 ? 'text-green-600' : weightChange.lastMonth < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {weightChange.lastMonth > 0 ? '+' : ''}{weightChange.lastMonth} kg
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Evolución del peso</h3>
            {weightHistory.length > 1 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      fontSize={12}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#22c55e" 
                      strokeWidth={3}
                      dot={{ fill: '#22c55e', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-12">
                Registra al menos 2 medidas para ver la gráfica
              </p>
            )}
          </div>

          {/* History */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Historial</h3>
            {measurements.length > 0 ? (
              <div className="space-y-3">
                {measurements.slice(0, 10).map((m, i) => (
                  <div key={m.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Scale className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{m.weight} kg</p>
                        <p className="text-sm text-gray-500">
                          {new Date(m.measured_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    {i > 0 && (
                      <span className={`text-sm font-medium ${
                        m.weight < measurements[i-1].weight 
                          ? 'text-red-600' 
                          : m.weight > measurements[i-1].weight 
                          ? 'text-green-600' 
                          : 'text-gray-500'
                      }`}>
                        {m.weight > measurements[i-1].weight ? '+' : ''}
                        {(m.weight - measurements[i-1].weight).toFixed(1)} kg
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Scale}
                title="Sin registros"
                description="Registra tu primer peso para empezar a seguir tu progreso"
                action={{
                  label: "Registrar peso",
                  onClick: () => setShowWeightModal(true)
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Photos Tab */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          {/* Filter */}
          <div className="flex gap-2">
            {(['all', 'front', 'side', 'back'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setPhotoFilter(cat)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  photoFilter === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' && 'Todas'}
                {cat === 'front' && 'Frontal'}
                {cat === 'side' && 'Lateral'}
                {cat === 'back' && 'Espalda'}
              </button>
            ))}
          </div>

          {/* Photos Grid */}
          {filteredPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="relative aspect-[3/4] rounded-xl overflow-hidden group"
                >
                  <img
                    src={photo.url}
                    alt={`Progreso ${photo.category}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="badge bg-white/90 text-gray-900 capitalize">
                        {photo.category === 'front' && 'Frontal'}
                        {photo.category === 'side' && 'Lateral'}
                        {photo.category === 'back' && 'Espalda'}
                      </span>
                      <p className="text-white text-sm mt-1">
                        {new Date(photo.taken_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Camera}
              title="Sin fotos"
              description="Añade fotos de tu progreso para ver tu evolución"
              action={{
                label: "Añadir foto",
                onClick: () => setShowPhotoModal(true)
              }}
            />
          )}
        </div>
      )}

      {/* Measurements Tab */}
      {activeTab === 'measurements' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Últimas medidas corporales</h3>
            {measurements[0]?.body_measurements ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(measurements[0].body_measurements).map(([key, value]) => (
                  <div key={key} className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 capitalize mb-1">
                      {key === 'chest' && 'Pecho'}
                      {key === 'waist' && 'Cintura'}
                      {key === 'hips' && 'Cadera'}
                      {key === 'biceps' && 'Bíceps'}
                      {key === 'thighs' && 'Muslos'}
                      {key === 'calves' && 'Gemelos'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{value} cm</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No hay medidas registradas. Añádelas al registrar tu peso.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Weight Modal */}
      <WeightModal 
        isOpen={showWeightModal} 
        onClose={() => setShowWeightModal(false)} 
      />

      {/* Photo Modal */}
      <PhotoModal 
        isOpen={showPhotoModal} 
        onClose={() => setShowPhotoModal(false)} 
      />

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <Modal
          isOpen={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          title="Foto de progreso"
          size="lg"
        >
          <img
            src={selectedPhoto.url}
            alt="Progreso"
            className="w-full rounded-xl mb-4"
          />
          <div className="flex items-center justify-between">
            <div>
              <span className="badge badge-info capitalize mb-2">
                {selectedPhoto.category === 'front' && 'Frontal'}
                {selectedPhoto.category === 'side' && 'Lateral'}
                {selectedPhoto.category === 'back' && 'Espalda'}
              </span>
              <p className="text-gray-500">
                {new Date(selectedPhoto.taken_at).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              {selectedPhoto.notes && (
                <p className="text-gray-600 mt-2">{selectedPhoto.notes}</p>
              )}
            </div>
            <button
              onClick={async () => {
                await deletePhoto(selectedPhoto.id);
                setSelectedPhoto(null);
              }}
              className="btn btn-secondary text-red-600"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function WeightModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuthStore();
  const { addMeasurement } = useProgressStore();
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [measurements, setMeasurements] = useState({
    chest: '',
    waist: '',
    hips: '',
    biceps: '',
    thighs: '',
    calves: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !weight) return;
    
    setIsSaving(true);
    
    const bodyMeasurements = Object.entries(measurements)
      .filter(([_, v]) => v)
      .reduce((acc, [k, v]) => ({ ...acc, [k]: parseFloat(v) }), {});

    await addMeasurement({
      user_id: user.id,
      weight: parseFloat(weight),
      body_measurements: Object.keys(bodyMeasurements).length > 0 ? bodyMeasurements : undefined,
      measured_at: date
    });
    
    setIsSaving(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar peso" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Peso (kg) *
            </label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="input"
              placeholder="75.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-3">Medidas corporales (opcional)</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(measurements).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm text-gray-500 mb-1 capitalize">
                  {key === 'chest' && 'Pecho'}
                  {key === 'waist' && 'Cintura'}
                  {key === 'hips' && 'Cadera'}
                  {key === 'biceps' && 'Bíceps'}
                  {key === 'thighs' && 'Muslos'}
                  {key === 'calves' && 'Gemelos'}
                  {' '}(cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={value}
                  onChange={(e) => setMeasurements({ ...measurements, [key]: e.target.value })}
                  className="input"
                  placeholder="-"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={onClose} className="btn btn-secondary flex-1">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!weight || isSaving}
            className="btn btn-primary flex-1"
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PhotoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuthStore();
  const { addPhoto, uploadPhoto } = useProgressStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [category, setCategory] = useState<ProgressPhoto['category']>('front');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSave = async () => {
    if (!user || !file) return;
    
    setIsSaving(true);
    
    const result = await uploadPhoto(user.id, file, category);
    
    if (result.url) {
      await addPhoto({
        user_id: user.id,
        url: result.url,
        category,
        taken_at: date,
        notes: notes || undefined
      });
    }
    
    setIsSaving(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Añadir foto de progreso" size="lg">
      <div className="space-y-4">
        {/* Upload */}
        {!preview ? (
          <label className="block w-full aspect-[3/4] border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Image className="w-12 h-12 mb-2" />
              <p>Haz clic para seleccionar una foto</p>
            </div>
          </label>
        ) : (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full aspect-[3/4] object-cover rounded-xl"
            />
            <button
              onClick={() => {
                setFile(null);
                setPreview('');
              }}
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProgressPhoto['category'])}
              className="input"
            >
              <option value="front">Frontal</option>
              <option value="side">Lateral</option>
              <option value="back">Espalda</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas (opcional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input"
            placeholder="Ej: Semana 4 del programa"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={onClose} className="btn btn-secondary flex-1">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!file || isSaving}
            className="btn btn-primary flex-1"
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
