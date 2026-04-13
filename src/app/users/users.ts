import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConfirmService } from '../services/confirm.service';
import { ConsultationService, PatientDTO } from '../services/consultation.service';
import { PatientService } from '../services/patient.service';
import { DossierService } from '../services/dossier';
import {
  UserRegistryService,
  RegistryUserDto,
  RegistryUserCreatePayload,
} from '../services/user-registry.service';

/** Vue liste « Patients » (dossiermedicale / consultation), hors user-service Symfony */
interface PatientViewUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age?: number;
  greftDate?: string;
  diagnostic?: string;
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  createdAt: Date;
}

@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.html',
  styleUrls: ['./users.css'],
})
export class Users implements OnInit {
  /** Route `/back/utilisateurs-postgres` : vue uniquement base PostgreSQL (sans onglet patients). */
  postgresDbOnly = false;

  /** Onglet : dossiers métier vs comptes PostgreSQL (Gateway + JWT) */
  activeTab: 'patients' | 'accounts' = 'patients';

  loadingPatients = false;

  /** Filtre API côté comptes : tous | patient | medecin */
  accountRoleFilter: 'all' | 'patient' | 'medecin' = 'all';

  constructor(
    private route: ActivatedRoute,
    private confirmService: ConfirmService,
    private consultationService: ConsultationService,
    private patientService: PatientService,
    private dossierService: DossierService,
    private userRegistry: UserRegistryService,
  ) {}

  viewMode: 'grid' | 'list' = 'grid';

  isModalOpen = false;
  isEditing = false;
  currentUser: Partial<PatientViewUser> = {};

  searchTerm = '';
  statusFilter = 'all';

  patients: PatientViewUser[] = [];

  loadingAccounts = false;
  accountsError = '';
  accounts: RegistryUserDto[] = [];

  isAccountModalOpen = false;
  editingAccountId: number | null = null;
  accountForm: Partial<RegistryUserCreatePayload> & { password?: string } = {
    role: 'patient',
  };

  ngOnInit(): void {
    this.postgresDbOnly = this.route.snapshot.data['postgresDbOnly'] === true;
    if (this.postgresDbOnly) {
      this.activeTab = 'accounts';
      this.loadAccounts();
    } else {
      this.loadPatients();
    }
  }

  selectTab(tab: 'patients' | 'accounts'): void {
    this.activeTab = tab;
    this.accountsError = '';
    if (tab === 'accounts') {
      this.loadAccounts();
    }
  }

  loadAccounts(): void {
    this.loadingAccounts = true;
    this.accountsError = '';
    const req =
      this.accountRoleFilter === 'all'
        ? this.userRegistry.list()
        : this.userRegistry.byRole(this.accountRoleFilter);
    req.subscribe({
      next: (data) => {
        this.accounts = Array.isArray(data) ? data : [];
        this.loadingAccounts = false;
      },
      error: (err) => {
        this.accounts = [];
        this.loadingAccounts = false;
        const m = err?.error?.message;
        this.accountsError =
          typeof m === 'string'
            ? m
            : 'Impossible de charger les comptes. Connectez-vous en médecin (JWT), puis vérifiez Gateway 8095 et user-service (127.0.0.1:8000).';
      },
    });
  }

  onAccountRoleFilterChange(): void {
    this.loadAccounts();
  }

  get filteredUsers(): PatientViewUser[] {
    let users = this.patients;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      users = users.filter(
        (user) =>
          (user.firstName || '').toLowerCase().includes(term) ||
          (user.lastName || '').toLowerCase().includes(term) ||
          (user.email || '').toLowerCase().includes(term) ||
          (user.phone || '').includes(this.searchTerm),
      );
    }
    if (this.statusFilter !== 'all') {
      users = users.filter((user) => user.status === this.statusFilter);
    }
    return users;
  }

  get filteredAccounts(): RegistryUserDto[] {
    let list = this.accounts;
    if (this.searchTerm) {
      const t = this.searchTerm.toLowerCase();
      list = list.filter(
        (u) =>
          (u.username || '').toLowerCase().includes(t) ||
          (u.firstName || '').toLowerCase().includes(t) ||
          (u.lastName || '').toLowerCase().includes(t) ||
          (u.email || '').toLowerCase().includes(t) ||
          (u.phone ?? '').includes(this.searchTerm),
      );
    }
    if (this.statusFilter === 'active') {
      list = list.filter((u) => u.isActive);
    } else if (this.statusFilter === 'inactive') {
      list = list.filter((u) => !u.isActive);
    }
    return list;
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  loadPatients(): void {
    this.loadingPatients = true;
    const applyPatients = (data: unknown[], diagnosticByPatient: Map<number, string>) => {
      this.patients = (Array.isArray(data) ? data : []).map((p) =>
        this.mapPatientToUser(p as PatientDTO | Record<string, unknown>, diagnosticByPatient),
      );
      this.loadingPatients = false;
    };
    this.dossierService.getAllDossiers().subscribe({
      next: (dossiers) => {
        const diagMap = new Map<number, string>();
        for (const d of dossiers || []) {
          const idP = d.idPatient ?? (d as { id_patient?: number }).id_patient;
          if (idP != null && d.diagnostic) {
            diagMap.set(Number(idP), d.diagnostic);
          }
        }
        this.consultationService.getPatients().subscribe({
          next: (data) => {
            const arr = Array.isArray(data) ? data : [];
            if (arr.length > 0) {
              applyPatients(arr, diagMap);
            } else {
              this.patientService.getAll().subscribe({
                next: (apiData) => applyPatients(apiData || [], diagMap),
                error: () => {
                  this.patients = [];
                  this.loadingPatients = false;
                },
              });
            }
          },
          error: () => {
            this.patientService.getAll().subscribe({
              next: (apiData) => applyPatients(apiData || [], diagMap),
              error: () => {
                this.patients = [];
                this.loadingPatients = false;
              },
            });
          },
        });
      },
      error: () => {
        const diagMap = new Map<number, string>();
        this.consultationService.getPatients().subscribe({
          next: (data) => {
            const arr = Array.isArray(data) ? data : [];
            if (arr.length > 0) {
              applyPatients(arr, diagMap);
            } else {
              this.patientService.getAll().subscribe({
                next: (apiData) => applyPatients(apiData || [], diagMap),
                error: () => {
                  this.patients = [];
                  this.loadingPatients = false;
                },
              });
            }
          },
          error: () => {
            this.patientService.getAll().subscribe({
              next: (apiData) => applyPatients(apiData || [], diagMap),
              error: () => {
                this.patients = [];
                this.loadingPatients = false;
              },
            });
          },
        });
      },
    });
  }

  private mapPatientToUser(
    p: PatientDTO | Record<string, unknown>,
    diagnosticByPatient?: Map<number, string>,
  ): PatientViewUser {
    const rec = p as Record<string, unknown>;
    const idPatient = rec['idPatient'] ?? rec['id_patient'] ?? rec['id'];
    const id = String(idPatient ?? '');
    const firstName = rec['firstName'] ?? rec['first_name'] ?? rec['prenom'] ?? '';
    const lastName = rec['lastName'] ?? rec['last_name'] ?? rec['nom'] ?? '';
    const email = rec['email'] ?? rec['username'] ?? '';
    const phone =
      rec['telephone'] ??
      rec['phone'] ??
      rec['tel'] ??
      rec['numTel'] ??
      rec['numeroTelephone'] ??
      rec['mobile'] ??
      '';
    const dateNaiss = rec['dateNaissance'] ?? rec['date_naissance'];
    const greftDate = rec['greftDate'] ?? rec['date_greffe'] ?? rec['dateGreffe'] ?? dateNaiss;
    const age = this.calcAge(dateNaiss as string | undefined);
    const diagnostic =
      idPatient != null && diagnosticByPatient
        ? diagnosticByPatient.get(Number(idPatient))
        : undefined;
    return {
      id,
      firstName: String(firstName),
      lastName: String(lastName),
      email: String(email),
      phone: String(phone),
      age: age ?? undefined,
      greftDate: greftDate ? String(greftDate).substring(0, 10) : undefined,
      diagnostic: diagnostic ?? undefined,
      status: 'active',
      createdAt: new Date(),
    };
  }

  private calcAge(dateStr: string | undefined): number | undefined {
    if (!dateStr) return undefined;
    const d = new Date(String(dateStr));
    if (isNaN(d.getTime())) return undefined;
    const now = new Date();
    return Math.floor((now.getTime() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.currentUser = {};
    this.isModalOpen = true;
  }

  openEditModal(user: PatientViewUser): void {
    this.isEditing = true;
    this.currentUser = { ...user };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.currentUser = {};
  }

  saveUser(): void {
    if (this.isEditing) {
      const index = this.patients.findIndex((u) => u.id === this.currentUser.id);
      if (index !== -1) {
        this.patients[index] = { ...this.patients[index], ...this.currentUser } as PatientViewUser;
      }
    } else {
      const newUser: PatientViewUser = {
        ...(this.currentUser as PatientViewUser),
        id: Date.now().toString(),
        createdAt: new Date(),
        status: 'active',
      };
      this.patients.push(newUser);
    }
    this.closeModal();
  }

  deleteUser(userId: string): void {
    this.confirmService
      .confirm('Êtes-vous sûr de vouloir supprimer ce patient ?', { title: 'Supprimer patient' })
      .then((ok) => {
        if (!ok) return;
        this.patients = this.patients.filter((p) => p.id !== userId);
      });
  }

  toggleStatus(user: PatientViewUser): void {
    user.status = user.status === 'active' ? 'inactive' : 'active';
  }

  openCreateAccountModal(): void {
    this.editingAccountId = null;
    this.accountForm = { role: 'patient' };
    this.accountsError = '';
    this.isAccountModalOpen = true;
  }

  openEditAccountModal(u: RegistryUserDto): void {
    this.editingAccountId = u.id;
    this.accountForm = {
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role as 'patient' | 'medecin',
      phone: u.phone ?? undefined,
      address: u.address ?? undefined,
      birthDate: u.birthDate ?? undefined,
      gender: u.gender ?? undefined,
      specialty: u.specialty ?? undefined,
      licenseNumber: u.licenseNumber ?? undefined,
      service: u.service ?? undefined,
      password: '',
    };
    this.accountsError = '';
    this.isAccountModalOpen = true;
  }

  closeAccountModal(): void {
    this.isAccountModalOpen = false;
    this.editingAccountId = null;
    this.accountForm = { role: 'patient' };
  }

  saveAccount(): void {
    const f = this.accountForm;
    if (this.editingAccountId != null) {
      const body: Record<string, unknown> = {
        firstName: f.firstName,
        lastName: f.lastName,
        email: f.email,
        phone: f.phone || null,
        address: f.address || null,
      };
      if (f.role === 'medecin') {
        body['specialty'] = f.specialty || null;
        body['licenseNumber'] = f.licenseNumber || null;
        body['service'] = f.service || null;
      }
      if (f.role === 'patient') {
        body['birthDate'] = f.birthDate || null;
        body['gender'] = f.gender || null;
      }
      if (f.password && f.password.length > 0) {
        body['password'] = f.password;
      }
      this.userRegistry.update(this.editingAccountId, body).subscribe({
        next: () => {
          this.closeAccountModal();
          this.loadAccounts();
          this.accountsError = '';
        },
        error: (err) => {
          this.accountsError = err?.error?.message ?? 'Mise à jour impossible.';
        },
      });
      return;
    }

    if (!f.username?.trim() || !f.firstName?.trim() || !f.lastName?.trim() || !f.email?.trim() || !f.password || !f.role) {
      this.accountsError = 'Champs requis : identifiant, prénom, nom, email, mot de passe, rôle.';
      return;
    }
    const payload: RegistryUserCreatePayload = {
      username: f.username.trim(),
      firstName: f.firstName.trim(),
      lastName: f.lastName.trim(),
      email: f.email.trim(),
      password: f.password,
      role: f.role,
      phone: f.phone?.trim() || undefined,
      address: f.address?.trim() || undefined,
      birthDate: f.birthDate || undefined,
      gender: f.gender || undefined,
      specialty: f.specialty || undefined,
      licenseNumber: f.licenseNumber || undefined,
      service: f.service || undefined,
    };
    this.userRegistry.create(payload).subscribe({
      next: () => {
        this.closeAccountModal();
        this.loadAccounts();
        this.accountsError = '';
      },
      error: (err) => {
        this.accountsError = err?.error?.message ?? 'Création impossible.';
      },
    });
  }

  deactivateRegistryUser(u: RegistryUserDto): void {
    this.confirmService
      .confirm(
        `Désactiver le compte « ${u.username} » dans la base utilisateur ? (Keycloak reste inchangé — à gérer dans l’admin Keycloak si besoin.)`,
        { title: 'Désactiver utilisateur' },
      )
      .then((ok) => {
        if (!ok) return;
        this.userRegistry.deactivate(u.id).subscribe({
          next: () => {
            this.loadAccounts();
            this.accountsError = '';
          },
          error: (err) => {
            this.accountsError = err?.error?.message ?? 'Échec de la désactivation.';
          },
        });
      });
  }

  getInitials(firstName: string, lastName: string): string {
    const a = (firstName || '').charAt(0);
    const b = (lastName || '').charAt(0);
    return `${a}${b}`.toUpperCase() || '?';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return '#48bb78';
      case 'inactive':
        return '#e53e3e';
      case 'pending':
        return '#ed8936';
      default:
        return '#718096';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  }

  accountRoleLabel(role: string): string {
    return role === 'medecin' ? 'Médecin' : 'Patient';
  }

  getGraftDuration(greftDate: string): string {
    const graft = new Date(greftDate);
    const now = new Date();
    const months = Math.floor((now.getTime() - graft.getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (months < 12) {
      return `${months} mois`;
    }
    const years = Math.floor(months / 12);
    return `${years} an${years > 1 ? 's' : ''}`;
  }
}
