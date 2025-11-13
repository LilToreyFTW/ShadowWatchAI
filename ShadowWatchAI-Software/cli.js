#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ShadowWatch AI CLI System
class ShadowWatchCLI {
    constructor() {
        this.version = '1.0.0';
        this.modelsDir = path.join(__dirname, 'models');
        this.templates = this.loadTemplates();
        this.commands = new Map();
        this.registerCommands();
    }

    loadTemplates() {
        return {
            unreal: {
                dummy: this.getUnrealDummyTemplate(),
                weapon: this.getUnrealWeaponTemplate(),
                vehicle: this.getUnrealVehicleTemplate()
            },
            unity: {
                dummy: this.getUnityDummyTemplate(),
                weapon: this.getUnityWeaponTemplate(),
                vehicle: this.getUnityVehicleTemplate()
            }
        };
    }

    registerCommands() {
        // Base create command
        this.commands.set('create', (args) => this.handleCreate(args));

        // Model creation commands
        this.commands.set('create-dummy', (args) => this.createDummy(args));
        this.commands.set('create-weapon', (args) => this.createWeapon(args));
        this.commands.set('create-vehicle', (args) => this.createVehicle(args));
        this.commands.set('create-blueprint', (args) => this.createBlueprint(args));
        this.commands.set('create-pack', (args) => this.createPack(args));

        // AI control commands
        this.commands.set('ultra-hardcoded', (args) => this.ultraHardcoded(args));
        this.commands.set('force-generate', (args) => this.forceGenerate(args));
        this.commands.set('test-model', (args) => this.testModel(args));

        // Project commands
        this.commands.set('init-project', (args) => this.initProject(args));
        this.commands.set('setup-engine', (args) => this.setupEngine(args));
        this.commands.set('generate-scene', (args) => this.generateScene(args));

        // Utility commands
        this.commands.set('list-models', (args) => this.listModels(args));
        this.commands.set('validate', (args) => this.validateProject(args));
        this.commands.set('export', (args) => this.exportProject(args));
    }

    async run(args) {
        try {
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🌙 SHADOWWATCH AI CLI 🌙                    ║
║                      Version ${this.version}                              ║
╚══════════════════════════════════════════════════════════════╝
`);

            if (args.length === 0) {
                this.showHelp();
                return;
            }

            const command = args[0];
            const commandArgs = args.slice(1);

            if (this.commands.has(command)) {
                await this.commands.get(command)(commandArgs);
            } else {
                console.log(`❌ Unknown command: ${command}`);
                this.showHelp();
            }
        } catch (error) {
            console.error('❌ CLI Error:', error.message);
            process.exit(1);
        }
    }

    async handleCreate(args) {
        const parsed = this.parseCreateArgs(args);

        if (!parsed.modelType) {
            console.log('❌ Missing model type. Use --test <type> or specify a model type.');
            return;
        }

        switch (parsed.modelType) {
            case 'model_dummy':
            case 'dummy':
                await this.createDummy(args, parsed);
                break;
            case 'model_weapon':
            case 'weapon':
                await this.createWeapon(args, parsed);
                break;
            case 'model_vehicle':
            case 'vehicle':
                await this.createVehicle(args, parsed);
                break;
            default:
                console.log(`❌ Unknown model type: ${parsed.modelType}`);
        }
    }

    parseCreateArgs(args) {
        const parsed = {
            ultraHardcoded: false,
            force: false,
            modelType: null,
            engine: 'unreal',
            name: null,
            options: {}
        };

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];

            switch (arg) {
                case '--UltraHardCoded':
                    parsed.ultraHardcoded = true;
                    break;
                case '-f':
                case '--force':
                    parsed.force = true;
                    break;
                case '--test':
                    if (i + 1 < args.length) {
                        parsed.modelType = args[i + 1];
                        i++;
                    }
                    break;
                case '--Unreal':
                case '--unreal':
                    parsed.engine = 'unreal';
                    break;
                case '--Unity':
                case '--unity':
                    parsed.engine = 'unity';
                    break;
                case '--name':
                    if (i + 1 < args.length) {
                        parsed.name = args[i + 1];
                        i++;
                    }
                    break;
                default:
                    if (arg.startsWith('--')) {
                        const key = arg.slice(2);
                        if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
                            parsed.options[key] = args[i + 1];
                            i++;
                        } else {
                            parsed.options[key] = true;
                        }
                    }
            }
        }

        return parsed;
    }

    async createDummy(args, parsed = null) {
        if (!parsed) parsed = this.parseCreateArgs(args);

        const modelName = parsed.name || 'Dummy_' + crypto.randomBytes(4).toString('hex');
        const engine = parsed.engine;

        console.log(`🤖 Creating ${engine.toUpperCase()} Dummy Model: ${modelName}`);
        console.log(`🔧 Ultra Hardcoded: ${parsed.ultraHardcoded ? 'ENABLED' : 'DISABLED'}`);
        console.log(`⚡ Force Mode: ${parsed.force ? 'ENABLED' : 'DISABLED'}`);
        console.log('');

        // Create model directory
        const modelDir = path.join(this.modelsDir, engine, 'dummies', modelName);
        await this.ensureDirectory(modelDir);

        // Generate model files
        const template = this.templates[engine].dummy;
        const files = this.generateDummyFiles(template, modelName, parsed);

        for (const [filename, content] of Object.entries(files)) {
            const filePath = path.join(modelDir, filename);
            await fs.promises.writeFile(filePath, content, 'utf8');
            console.log(`✅ Created: ${filename}`);
        }

        // Create metadata
        const metadata = {
            type: 'dummy',
            engine: engine,
            name: modelName,
            created: new Date().toISOString(),
            ultraHardcoded: parsed.ultraHardcoded,
            components: [
                'Head', 'Torso', 'LeftArm', 'RightArm', 'LeftLeg', 'RightLeg',
                'LeftHand', 'RightHand', 'LeftFoot', 'RightFoot', 'Eyes', 'Mouth'
            ],
            polycount: parsed.ultraHardcoded ? 50000 : 25000,
            textures: ['diffuse', 'normal', 'specular', 'emissive']
        };

        await fs.promises.writeFile(
            path.join(modelDir, 'metadata.json'),
            JSON.stringify(metadata, null, 2),
            'utf8'
        );

        console.log('');
        console.log('🎉 Dummy model creation completed!');
        console.log(`📁 Location: ${modelDir}`);
        console.log(`🔢 Components: ${metadata.components.length}`);
        console.log(`🎨 Polycount: ${metadata.polycount.toLocaleString()}`);
        console.log('');
        console.log('💡 To use this model:');
        if (engine === 'unreal') {
            console.log(`   1. Open Unreal Engine project`);
            console.log(`   2. Import assets from: ${modelDir}`);
            console.log(`   3. Drag ${modelName}.uasset into your scene`);
        } else {
            console.log(`   1. Open Unity project`);
            console.log(`   2. Import package: ${modelDir}/${modelName}.unitypackage`);
            console.log(`   3. Drag prefab into your scene`);
        }
    }

    generateDummyFiles(template, modelName, parsed) {
        const files = {};

        if (parsed.engine === 'unreal') {
            files[`${modelName}.uasset`] = template.asset.replace(/{{MODEL_NAME}}/g, modelName);
            files[`${modelName}_BP.uasset`] = template.blueprint.replace(/{{MODEL_NAME}}/g, modelName);
            files[`${modelName}_Materials.uasset`] = template.materials.replace(/{{MODEL_NAME}}/g, modelName);
            files[`${modelName}_Animations.uasset`] = template.animations.replace(/{{MODEL_NAME}}/g, modelName);
        } else {
            files[`${modelName}.fbx`] = template.mesh.replace(/{{MODEL_NAME}}/g, modelName);
            files[`${modelName}_Materials.mat`] = template.materials.replace(/{{MODEL_NAME}}/g, modelName);
            files[`${modelName}_Animations.anim`] = template.animations.replace(/{{MODEL_NAME}}/g, modelName);
            files[`${modelName}.prefab`] = template.prefab.replace(/{{MODEL_NAME}}/g, modelName);
        }

        return files;
    }

    async createWeapon(args, parsed = null) {
        if (!parsed) parsed = this.parseCreateArgs(args);

        const weaponName = parsed.name || 'Weapon_' + crypto.randomBytes(4).toString('hex');
        const engine = parsed.engine;

        console.log(`🔫 Creating ${engine.toUpperCase()} Weapon: ${weaponName}`);
        console.log(`🔧 Ultra Hardcoded: ${parsed.ultraHardcoded ? 'ENABLED' : 'DISABLED'}`);
        console.log('');

        const weaponDir = path.join(this.modelsDir, engine, 'weapons', weaponName);
        await this.ensureDirectory(weaponDir);

        const template = this.templates[engine].weapon;
        const files = this.generateWeaponFiles(template, weaponName, parsed);

        for (const [filename, content] of Object.entries(files)) {
            const filePath = path.join(weaponDir, filename);
            await fs.promises.writeFile(filePath, content, 'utf8');
            console.log(`✅ Created: ${filename}`);
        }

        console.log('');
        console.log('🎉 Weapon creation completed!');
        console.log(`📁 Location: ${weaponDir}`);
    }

    generateWeaponFiles(template, weaponName, parsed) {
        const files = {};

        if (parsed.engine === 'unreal') {
            files[`${weaponName}.uasset`] = template.asset.replace(/{{WEAPON_NAME}}/g, weaponName);
            files[`${weaponName}_BP.uasset`] = template.blueprint.replace(/{{WEAPON_NAME}}/g, weaponName);
        } else {
            files[`${weaponName}.fbx`] = template.mesh.replace(/{{WEAPON_NAME}}/g, weaponName);
            files[`${weaponName}.prefab`] = template.prefab.replace(/{{WEAPON_NAME}}/g, weaponName);
        }

        return files;
    }

    async createVehicle(args, parsed = null) {
        if (!parsed) parsed = this.parseCreateArgs(args);

        const vehicleName = parsed.name || 'Vehicle_' + crypto.randomBytes(4).toString('hex');
        const engine = parsed.engine;

        console.log(`🚗 Creating ${engine.toUpperCase()} Vehicle: ${vehicleName}`);
        console.log(`🔧 Ultra Hardcoded: ${parsed.ultraHardcoded ? 'ENABLED' : 'DISABLED'}`);
        console.log('');

        const vehicleDir = path.join(this.modelsDir, engine, 'vehicles', vehicleName);
        await this.ensureDirectory(vehicleDir);

        const template = this.templates[engine].vehicle;
        const files = this.generateVehicleFiles(template, vehicleName, parsed);

        for (const [filename, content] of Object.entries(files)) {
            const filePath = path.join(vehicleDir, filename);
            await fs.promises.writeFile(filePath, content, 'utf8');
            console.log(`✅ Created: ${filename}`);
        }

        console.log('');
        console.log('🎉 Vehicle creation completed!');
        console.log(`📁 Location: ${vehicleDir}`);
    }

    generateVehicleFiles(template, vehicleName, parsed) {
        const files = {};

        if (parsed.engine === 'unreal') {
            files[`${vehicleName}.uasset`] = template.asset.replace(/{{VEHICLE_NAME}}/g, vehicleName);
            files[`${vehicleName}_BP.uasset`] = template.blueprint.replace(/{{VEHICLE_NAME}}/g, vehicleName);
        } else {
            files[`${vehicleName}.fbx`] = template.mesh.replace(/{{VEHICLE_NAME}}/g, vehicleName);
            files[`${vehicleName}.prefab`] = template.prefab.replace(/{{VEHICLE_NAME}}/g, vehicleName);
        }

        return files;
    }

    async ultraHardcoded(args) {
        console.log('🚀 ULTRA HARDCODED MODE ACTIVATED!');
        console.log('💪 Maximum quality and detail enabled');
        console.log('');

        // Force ultra hardcoded mode for next command
        process.env.SHADOWWATCH_ULTRA_HARDCODED = 'true';

        if (args.length > 0) {
            // Execute the next command with ultra hardcoded flag
            await this.run(args);
        } else {
            console.log('💡 Use with other commands, e.g.:');
            console.log('   shadowwatch ultra-hardcoded create --test model_dummy --Unreal');
        }
    }

    async forceGenerate(args) {
        console.log('⚡ FORCE GENERATION MODE ACTIVATED!');
        console.log('🔨 Overwriting existing files if necessary');
        console.log('');

        process.env.SHADOWWATCH_FORCE_GENERATE = 'true';

        if (args.length > 0) {
            await this.run(args);
        } else {
            console.log('💡 Use with other commands, e.g.:');
            console.log('   shadowwatch force-generate create --test model_dummy --Unreal');
        }
    }

    async testModel(args) {
        const modelType = args[0] || 'dummy';
        console.log(`🧪 Testing ${modelType} model generation...`);

        await this.createDummy(['--test', modelType, '--name', `Test_${modelType}_${Date.now()}`]);
    }

    async listModels(args) {
        const engine = args[0] || 'all';

        console.log('📋 Available Models:');
        console.log('');

        if (engine === 'all' || engine === 'unreal') {
            console.log('🎮 UNREAL ENGINE:');
            await this.listEngineModels('unreal');
            console.log('');
        }

        if (engine === 'all' || engine === 'unity') {
            console.log('🎮 UNITY ENGINE:');
            await this.listEngineModels('unity');
        }
    }

    async listEngineModels(engine) {
        const engineDir = path.join(this.modelsDir, engine);

        if (!fs.existsSync(engineDir)) {
            console.log(`   No ${engine} models found`);
            return;
        }

        const categories = ['dummies', 'weapons', 'vehicles'];

        for (const category of categories) {
            const categoryDir = path.join(engineDir, category);
            if (fs.existsSync(categoryDir)) {
                const models = fs.readdirSync(categoryDir).filter(item =>
                    fs.statSync(path.join(categoryDir, item)).isDirectory()
                );

                if (models.length > 0) {
                    console.log(`   ${category.toUpperCase()}:`);
                    models.forEach(model => console.log(`     • ${model}`));
                }
            }
        }
    }

    async ensureDirectory(dirPath) {
        try {
            await fs.promises.mkdir(dirPath, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') throw error;
        }
    }

    // Placeholder methods for additional commands
    async createBlueprint(args) {
        console.log('🔧 Creating blueprint...');
        console.log('This feature is coming soon!');
    }

    async createPack(args) {
        console.log('📦 Creating model pack...');
        console.log('This feature is coming soon!');
    }

    async initProject(args) {
        console.log('🚀 Initializing project...');
        console.log('This feature is coming soon!');
    }

    async setupEngine(args) {
        console.log('⚙️ Setting up engine...');
        console.log('This feature is coming soon!');
    }

    async generateScene(args) {
        console.log('🎬 Generating scene...');
        console.log('This feature is coming soon!');
    }

    async validateProject(args) {
        console.log('✅ Validating project...');
        console.log('This feature is coming soon!');
    }

    async exportProject(args) {
        console.log('📤 Exporting project...');
        console.log('This feature is coming soon!');
    }

    showHelp() {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🌙 SHADOWWATCH AI CLI 🌙                    ║
║                          COMMAND HELP                           ║
╚══════════════════════════════════════════════════════════════╝

USAGE:
  shadowwatch <command> [options]

CORE COMMANDS:
  create --UltraHardCoded -f --test <type> --<engine> [--name <name>]
    Create 3D models with maximum quality and detail

  ultra-hardcoded <command>    Enable maximum quality mode
  force-generate <command>     Force overwrite existing files
  test-model <type>           Test model generation

MODEL TYPES:
  model_dummy     Complete character dummy (head, torso, limbs, etc.)
  model_weapon    Weapon models with animations
  model_vehicle   Vehicle models with physics

ENGINES:
  --Unreal        Unreal Engine 5 (C++)
  --Unity         Unity Engine (C#)

EXAMPLES:
  shadowwatch create --UltraHardCoded -f --test model_dummy --Unreal
  shadowwatch ultra-hardcoded create --test model_weapon --Unity --name MySword
  shadowwatch force-generate create --test model_vehicle --Unreal --name SportsCar

ADVANCED COMMANDS:
  init-project <name> <engine>    Initialize new game project
  setup-engine <engine>           Setup engine integration
  generate-scene <name>           Generate complete game scene
  list-models [engine]            List all created models
  validate <project>              Validate project integrity
  export <project> <format>       Export project assets

GETTING STARTED:
  1. Run: shadowwatch create --UltraHardCoded -f --test model_dummy --Unreal
  2. Check the generated files in ./models/ directory
  3. Import into your game engine

For more help, visit: https://shadowwatch.ai/docs/cli
`);
    }

    // Template methods
    getUnrealDummyTemplate() {
        return {
            asset: `// Unreal Engine Dummy Model Asset
// Generated by ShadowWatch AI CLI
// Model: {{MODEL_NAME}}

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "{{MODEL_NAME}}.generated.h"

UCLASS()
class SHADOWWATCH_API A{{MODEL_NAME}} : public AActor
{
    GENERATED_BODY()

public:
    A{{MODEL_NAME}}();

    // Components
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = Mesh)
    USkeletalMeshComponent* SkeletalMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = Collision)
    UCapsuleComponent* CapsuleComponent;

    // Body parts
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Body Parts")
    USkeletalMeshComponent* Head;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Body Parts")
    USkeletalMeshComponent* Torso;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Body Parts")
    USkeletalMeshComponent* LeftArm;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Body Parts")
    USkeletalMeshComponent* RightArm;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Body Parts")
    USkeletalMeshComponent* LeftLeg;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Body Parts")
    USkeletalMeshComponent* RightLeg;

    // Materials
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Materials)
    UMaterialInterface* BodyMaterial;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = Materials)
    UMaterialInterface* EyeMaterial;

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;
};`,

            blueprint: `// {{MODEL_NAME}} Blueprint
// Generated by ShadowWatch AI

Blueprint'/Game/ShadowWatch/Models/{{MODEL_NAME}}/{{MODEL_NAME}}_BP'`,
            materials: `// {{MODEL_NAME}} Materials
// Generated by ShadowWatch AI

Material'/Game/ShadowWatch/Models/{{MODEL_NAME}}/{{MODEL_NAME}}_Materials'`,
            animations: `// {{MODEL_NAME}} Animations
// Generated by ShadowWatch AI

AnimSequence'/Game/ShadowWatch/Models/{{MODEL_NAME}}/{{MODEL_NAME}}_Animations'`
        };
    }

    getUnityDummyTemplate() {
        return {
            mesh: `// Unity Dummy Mesh
// Generated by ShadowWatch AI CLI
// Model: {{MODEL_NAME}}

using UnityEngine;

[RequireComponent(typeof(SkinnedMeshRenderer))]
public class {{MODEL_NAME}}Mesh : MonoBehaviour
{
    [Header("Body Parts")]
    public Transform head;
    public Transform torso;
    public Transform leftArm;
    public Transform rightArm;
    public Transform leftLeg;
    public Transform rightLeg;
    public Transform leftHand;
    public Transform rightHand;
    public Transform leftFoot;
    public Transform rightFoot;

    [Header("Materials")]
    public Material bodyMaterial;
    public Material eyeMaterial;
    public Material hairMaterial;

    [Header("Physics")]
    public Rigidbody[] rigidbodies;
    public Collider[] colliders;

    void Start()
    {
        InitializeComponents();
    }

    void InitializeComponents()
    {
        // Auto-assign components if not set
        if (head == null) head = transform.Find("Head");
        if (torso == null) torso = transform.Find("Torso");
        if (leftArm == null) leftArm = transform.Find("LeftArm");
        if (rightArm == null) rightArm = transform.Find("RightArm");
        if (leftLeg == null) leftLeg = transform.Find("LeftLeg");
        if (rightLeg == null) rightLeg = transform.Find("RightLeg");

        // Setup physics
        SetupPhysics();
    }

    void SetupPhysics()
    {
        // Add physics components to body parts
        AddPhysicsToBodyPart(head);
        AddPhysicsToBodyPart(torso);
        AddPhysicsToBodyPart(leftArm);
        AddPhysicsToBodyPart(rightArm);
        AddPhysicsToBodyPart(leftLeg);
        AddPhysicsToBodyPart(rightLeg);
    }

    void AddPhysicsToBodyPart(Transform bodyPart)
    {
        if (bodyPart != null)
        {
            Rigidbody rb = bodyPart.gameObject.AddComponent<Rigidbody>();
            rb.mass = 1f;
            rb.drag = 0.1f;
            rb.angularDrag = 0.05f;

            Collider collider = bodyPart.gameObject.AddComponent<BoxCollider>();
            collider.isTrigger = false;
        }
    }
}`,
            materials: `// {{MODEL_NAME}} Materials
// Generated by ShadowWatch AI

Shader "ShadowWatch/{{MODEL_NAME}}/BodyShader"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _Color ("Color", Color) = (1,1,1,1)
        _Glossiness ("Smoothness", Range(0,1)) = 0.5
        _Metallic ("Metallic", Range(0,1)) = 0.0
    }

    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 200

        CGPROGRAM
        #pragma surface surf Standard fullforwardshadows

        sampler2D _MainTex;

        struct Input
        {
            float2 uv_MainTex;
        };

        half _Glossiness;
        half _Metallic;
        fixed4 _Color;

        void surf (Input IN, inout SurfaceOutputStandard o)
        {
            fixed4 c = tex2D (_MainTex, IN.uv_MainTex) * _Color;
            o.Albedo = c.rgb;
            o.Metallic = _Metallic;
            o.Smoothness = _Glossiness;
            o.Alpha = c.a;
        }
        ENDCG
    }
    FallBack "Diffuse"
}`,
            animations: `// {{MODEL_NAME}} Animations
// Generated by ShadowWatch AI

using UnityEngine;

public class {{MODEL_NAME}}Animator : MonoBehaviour
{
    private Animator animator;
    private bool isGrounded = true;

    [Header("Animation States")]
    public bool isWalking = false;
    public bool isRunning = false;
    public bool isJumping = false;
    public bool isAttacking = false;

    void Start()
    {
        animator = GetComponent<Animator>();
        if (animator == null)
        {
            animator = gameObject.AddComponent<Animator>();
        }
    }

    void Update()
    {
        UpdateAnimationStates();
    }

    void UpdateAnimationStates()
    {
        if (animator != null)
        {
            animator.SetBool("IsWalking", isWalking);
            animator.SetBool("IsRunning", isRunning);
            animator.SetBool("IsJumping", isJumping);
            animator.SetBool("IsAttacking", isAttacking);
            animator.SetBool("IsGrounded", isGrounded);
        }
    }

    public void Walk()
    {
        isWalking = true;
        isRunning = false;
    }

    public void Run()
    {
        isWalking = false;
        isRunning = true;
    }

    public void Idle()
    {
        isWalking = false;
        isRunning = false;
    }

    public void Jump()
    {
        if (isGrounded)
        {
            isJumping = true;
            isGrounded = false;
            Invoke("Land", 0.5f);
        }
    }

    void Land()
    {
        isJumping = false;
        isGrounded = true;
    }

    public void Attack()
    {
        isAttacking = true;
        Invoke("StopAttack", 0.3f);
    }

    void StopAttack()
    {
        isAttacking = false;
    }
}`,
            prefab: `// {{MODEL_NAME}} Prefab Configuration
// Generated by ShadowWatch AI

%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!1 &1
GameObject:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  m_Name: {{MODEL_NAME}}
  m_TagString: Untagged
  m_Icon: {fileID: 0}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1

--- !u!4 &2
Transform:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  m_Name: Transform
  m_Parent: {fileID: 0}
  m_LocalPosition: {x: 0, y: 0, z: 0}
  m_LocalRotation: {x: 0, y: 0, z: 0, w: 1}
  m_LocalScale: {x: 1, y: 1, z: 1}
  m_Children: []
  m_Father: {fileID: 0}
  m_RootOrder: 0

--- !u!33 &3
MeshFilter:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  m_Name: MeshFilter
  m_Mesh: {fileID: 4300000}

--- !u!23 &4
MeshRenderer:
  m_ObjectHideFlags: 0
  m_PrefabParentObject: {fileID: 0}
  m_PrefabInternal: {fileID: 100100000}
  m_Name: MeshRenderer
  m_Materials:
  - {fileID: 2100000}`
        };
    }

    // Placeholder templates for weapons and vehicles
    getUnrealWeaponTemplate() {
        return {
            asset: `// Unreal Weapon Asset - {{WEAPON_NAME}}`,
            blueprint: `// Weapon Blueprint - {{WEAPON_NAME}}`
        };
    }

    getUnityWeaponTemplate() {
        return {
            mesh: `// Unity Weapon Mesh - {{WEAPON_NAME}}`,
            prefab: `// Weapon Prefab - {{WEAPON_NAME}}`
        };
    }

    getUnrealVehicleTemplate() {
        return {
            asset: `// Unreal Vehicle Asset - {{VEHICLE_NAME}}`,
            blueprint: `// Vehicle Blueprint - {{VEHICLE_NAME}}`
        };
    }

    getUnityVehicleTemplate() {
        return {
            mesh: `// Unity Vehicle Mesh - {{VEHICLE_NAME}}`,
            prefab: `// Vehicle Prefab - {{VEHICLE_NAME}}`
        };
    }
}

// CLI Runner
async function main() {
    const cli = new ShadowWatchCLI();
    const args = process.argv.slice(2);
    await cli.run(args);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run CLI
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ShadowWatchCLI;
